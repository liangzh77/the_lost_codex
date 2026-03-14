import random
from datetime import date, datetime
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, SessionLocal
from models import User, Word, WordBank, UserWordProgress, LearningRecord, LearningGroup
from auth import get_current_user
from services.spaced_repetition import get_next_review_date, is_mastered, TOTAL_STAGES, get_total_stages
from services.ai_complete import complete_word_info

router = APIRouter(prefix="/api/learning", tags=["learning"])


class StartNewRequest(BaseModel):
    word_bank_id: int | None = None
    custom_words: list[str] | None = None  # 用户自定义输入的英文单词


class ConfirmDoneRequest(BaseModel):
    word_ids: list[int]


class CheckWordsRequest(BaseModel):
    words: list[str]


@router.post("/check-words")
def check_words(body: CheckWordsRequest, db: Session = Depends(get_db)):
    """检查哪些词在词库中已存在"""
    existing = db.query(Word.english).filter(Word.english.in_(body.words)).all()
    found = {w[0].lower() for w in existing}
    return {
        "existing": [w for w in body.words if w.lower() in found],
        "new": [w for w in body.words if w.lower() not in found],
    }


# ---------- 学新词 ----------

@router.post("/new")
def start_new_words(
    body: StartNewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """从词库随机抽取一组新词，或根据用户输入查找单词"""
    if body.custom_words:
        words = db.query(Word).filter(Word.english.in_(body.custom_words)).all()
        found = {w.english.lower() for w in words}
        not_found = [w for w in body.custom_words if w.lower() not in found]
        # 词库中没有的单词自动创建，用AI补全信息，放入"自定义单词"词库
        if not_found:
            custom_bank = db.query(WordBank).filter(WordBank.name == "自定义单词").first()
            if not custom_bank:
                custom_bank = WordBank(name="自定义单词", display_order=99)
                db.add(custom_bank)
                db.flush()
            for nf in not_found:
                info = complete_word_info(nf)
                new_word = Word(
                    english=nf,
                    chinese=info.get("chinese", ""),
                    phonetic=info.get("phonetic", ""),
                    chinese_explanation=info.get("chinese_explanation", ""),
                    english_explanation=info.get("english_explanation", ""),
                    example_sentence=info.get("example_sentence", ""),
                    word_bank_id=custom_bank.id,
                )
                db.add(new_word)
                db.flush()
                words.append(new_word)
        if not_found:
            db.commit()
    elif body.word_bank_id:
        # 排除用户已在学习的单词
        learned_ids = (
            db.query(UserWordProgress.word_id)
            .filter(UserWordProgress.user_id == user.id)
            .subquery()
        )
        words = (
            db.query(Word)
            .filter(Word.word_bank_id == body.word_bank_id)
            .filter(~Word.id.in_(db.query(learned_ids.c.word_id)))
            .order_by(func.random())
            .limit(user.group_size)
            .all()
        )
    else:
        raise HTTPException(status_code=400, detail="请指定词库或自定义单词")

    # 补全缺失详细信息的单词
    need_commit = False
    for w in words:
        if not w.chinese:
            info = complete_word_info(w.english)
            w.chinese = info.get("chinese", "")
            w.phonetic = info.get("phonetic", "")
            w.chinese_explanation = info.get("chinese_explanation", "")
            w.english_explanation = info.get("english_explanation", "")
            w.example_sentence = info.get("example_sentence", "")
            need_commit = True
    if need_commit:
        db.commit()

    return [
        {
            "id": w.id,
            "english": w.english,
            "chinese": w.chinese,
            "phonetic": w.phonetic,
            "chinese_explanation": w.chinese_explanation,
            "english_explanation": w.english_explanation,
            "example_sentence": w.example_sentence,
        }
        for w in words
    ]


# ---------- 抽取新词（不补全） ----------

@router.post("/new-pick")
def pick_new_words(
    body: StartNewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """从词库随机抽取一组新词，返回基本信息（不做AI补全）"""
    if body.word_bank_id:
        learned_ids = (
            db.query(UserWordProgress.word_id)
            .filter(UserWordProgress.user_id == user.id)
            .subquery()
        )
        words = (
            db.query(Word)
            .filter(Word.word_bank_id == body.word_bank_id)
            .filter(~Word.id.in_(db.query(learned_ids.c.word_id)))
            .order_by(func.random())
            .limit(user.group_size)
            .all()
        )
    else:
        raise HTTPException(status_code=400, detail="请指定词库")

    return [
        {
            "id": w.id,
            "english": w.english,
            "chinese": w.chinese,
            "needs_complete": not bool(w.chinese),
        }
        for w in words
    ]


# ---------- 补全单个单词 ----------

@router.post("/complete/{word_id}")
def complete_single_word(
    word_id: int,
    db: Session = Depends(get_db),
):
    """用AI补全单个单词的详细信息"""
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="单词不存在")
    if not word.chinese:
        info = complete_word_info(word.english)
        word.chinese = info.get("chinese", "")
        word.phonetic = info.get("phonetic", "")
        word.chinese_explanation = info.get("chinese_explanation", "")
        word.english_explanation = info.get("english_explanation", "")
        word.example_sentence = info.get("example_sentence", "")
        db.commit()
    return {
        "id": word.id,
        "english": word.english,
        "chinese": word.chinese,
        "phonetic": word.phonetic,
        "chinese_explanation": word.chinese_explanation,
        "english_explanation": word.english_explanation,
        "example_sentence": word.example_sentence,
    }


# ---------- 批量补全 ----------

class BatchCompleteRequest(BaseModel):
    word_ids: list[int]


def _complete_one_word(word_id: int) -> dict:
    """在独立 session 中补全一个单词（用于线程池）"""
    db = SessionLocal()
    try:
        word = db.query(Word).filter(Word.id == word_id).first()
        if not word:
            return {}
        if not word.chinese:
            info = complete_word_info(word.english)
            word.chinese = info.get("chinese", "")
            word.phonetic = info.get("phonetic", "")
            word.chinese_explanation = info.get("chinese_explanation", "")
            word.english_explanation = info.get("english_explanation", "")
            word.example_sentence = info.get("example_sentence", "")
            db.commit()
        return {
            "id": word.id,
            "english": word.english,
            "chinese": word.chinese,
            "phonetic": word.phonetic,
            "chinese_explanation": word.chinese_explanation,
            "english_explanation": word.english_explanation,
            "example_sentence": word.example_sentence,
        }
    finally:
        db.close()


@router.post("/complete-batch")
def complete_batch_words(body: BatchCompleteRequest):
    """并发补全多个单词的详细信息"""
    with ThreadPoolExecutor(max_workers=min(len(body.word_ids), 10)) as pool:
        results = list(pool.map(_complete_one_word, body.word_ids))
    return [r for r in results if r]


# ---------- 今日复习 ----------

@router.get("/review/today")
def get_today_review(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取今天需要复习的单词"""
    today = date.today()
    progress_list = (
        db.query(UserWordProgress)
        .filter(
            UserWordProgress.user_id == user.id,
            UserWordProgress.next_review_date <= today,
            UserWordProgress.current_stage < get_total_stages(user.review_intervals),
        )
        .all()
    )
    result = []
    for p in progress_list:
        w = p.word
        result.append({
            "id": w.id,
            "english": w.english,
            "chinese": w.chinese,
            "phonetic": w.phonetic,
            "chinese_explanation": w.chinese_explanation,
            "english_explanation": w.english_explanation,
            "example_sentence": w.example_sentence,
            "current_stage": p.current_stage,
        })
    return result


@router.get("/review/today/count")
def get_today_review_count(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取今天需要复习的单词数量"""
    today = date.today()
    count = (
        db.query(UserWordProgress)
        .filter(
            UserWordProgress.user_id == user.id,
            UserWordProgress.next_review_date <= today,
            UserWordProgress.current_stage < get_total_stages(user.review_intervals),
        )
        .count()
    )
    return {"count": count}


# ---------- 生成测试题 ----------

@router.get("/quiz/{word_id}")
def get_quiz(
    word_id: int,
    quiz_type: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """为单个单词生成一道四选一测试题"""
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="单词不存在")

    # 指定题型或随机选
    valid_types = ["cn_to_en", "en_to_cn", "en_to_explanation"]
    if not quiz_type or quiz_type not in valid_types:
        quiz_type = random.choice(valid_types)

    # 获取干扰项（只从已有详细信息的单词中选）
    distractors = (
        db.query(Word)
        .filter(Word.id != word_id, func.length(Word.chinese) > 0)
        .order_by(func.random())
        .limit(3)
        .all()
    )

    if quiz_type == "cn_to_en":
        question = word.chinese
        correct = word.english
        options = [w.english for w in distractors]
    elif quiz_type == "en_to_cn":
        question = word.english
        correct = word.chinese
        options = [w.chinese for w in distractors]
    else:
        question = word.english
        correct = word.chinese_explanation
        options = [w.chinese_explanation for w in distractors]

    # 去重并过滤空值，确保正确答案在选项中
    options = [o for o in options if o and o != correct]
    options.append(correct)
    random.shuffle(options)

    return {
        "word_id": word_id,
        "quiz_type": quiz_type,
        "question": question,
        "options": options,
        "correct_answer": correct,
    }


# ---------- 确认学完 ----------

@router.post("/confirm")
def confirm_done(
    body: ConfirmDoneRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """用户确认学完一组单词，更新进度和记录"""
    today = date.today()
    now = datetime.now()

    # 创建学习组
    group_count = db.query(LearningGroup).filter(LearningGroup.user_id == user.id).count()
    group = LearningGroup(
        user_id=user.id,
        name=f"第{group_count + 1}组",
        created_at=now,
    )
    db.add(group)
    db.flush()

    for word_id in body.word_ids:
        progress = (
            db.query(UserWordProgress)
            .filter(UserWordProgress.user_id == user.id, UserWordProgress.word_id == word_id)
            .first()
        )
        if progress:
            progress.current_stage += 1
            progress.next_review_date = get_next_review_date(progress.current_stage, today, user.review_intervals)
            if not progress.group_id:
                progress.group_id = group.id
        else:
            progress = UserWordProgress(
                user_id=user.id,
                word_id=word_id,
                current_stage=1,
                next_review_date=get_next_review_date(1, today, user.review_intervals),
                group_id=group.id,
            )
            db.add(progress)

        # 记录学习日志
        record = LearningRecord(
            user_id=user.id,
            word_id=word_id,
            studied_at=now,
            stage_at_time=progress.current_stage,
        )
        db.add(record)

    db.commit()
    return {"message": "学习记录已保存", "count": len(body.word_ids)}


# ---------- 单词列表 ----------

@router.get("/words/recent")
def get_recent_words(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """最近背的单词（按最后学习时间倒序）"""
    records = (
        db.query(LearningRecord)
        .filter(LearningRecord.user_id == user.id)
        .order_by(LearningRecord.studied_at.desc())
        .limit(50)
        .all()
    )
    seen = set()
    result = []
    for r in records:
        if r.word_id not in seen:
            seen.add(r.word_id)
            w = r.word
            # 获取当前学习阶段
            progress = db.query(UserWordProgress).filter(
                UserWordProgress.user_id == user.id, UserWordProgress.word_id == w.id
            ).first()
            stage = progress.current_stage if progress else 0
            result.append({"id": w.id, "english": w.english, "chinese": w.chinese, "studied_at": str(r.studied_at), "stage": stage})
    return result


@router.get("/words/learning")
def get_learning_words(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """正在背诵的单词"""
    progress_list = (
        db.query(UserWordProgress)
        .filter(
            UserWordProgress.user_id == user.id,
            UserWordProgress.current_stage < get_total_stages(user.review_intervals),
        )
        .all()
    )
    result = []
    for p in progress_list:
        # 获取最近学习时间
        last_record = (
            db.query(LearningRecord)
            .filter(LearningRecord.user_id == user.id, LearningRecord.word_id == p.word_id)
            .order_by(LearningRecord.studied_at.desc())
            .first()
        )
        studied_at = str(last_record.studied_at) if last_record else ""
        result.append({"id": p.word.id, "english": p.word.english, "chinese": p.word.chinese, "stage": p.current_stage, "next_review": str(p.next_review_date), "studied_at": studied_at})
    return result


@router.get("/words/mastered")
def get_mastered_words(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """已掌握的单词"""
    progress_list = (
        db.query(UserWordProgress)
        .filter(
            UserWordProgress.user_id == user.id,
            UserWordProgress.current_stage >= get_total_stages(user.review_intervals),
        )
        .all()
    )
    return [
        {"id": p.word.id, "english": p.word.english, "chinese": p.word.chinese}
        for p in progress_list
    ]


@router.get("/stats")
def get_learning_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """用户学习统计"""
    learning = (
        db.query(UserWordProgress)
        .filter(UserWordProgress.user_id == user.id, UserWordProgress.current_stage < get_total_stages(user.review_intervals))
        .count()
    )
    mastered = (
        db.query(UserWordProgress)
        .filter(UserWordProgress.user_id == user.id, UserWordProgress.current_stage >= get_total_stages(user.review_intervals))
        .count()
    )
    return {"learning": learning, "mastered": mastered}


# ---------- 组列表 ----------

@router.get("/groups/recent")
def get_recent_groups(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """最近的学习组（按时间倒序）"""
    today = date.today()
    groups = (
        db.query(LearningGroup)
        .filter(LearningGroup.user_id == user.id)
        .order_by(LearningGroup.created_at.desc())
        .all()
    )
    result = []
    for g in groups:
        if len(g.words_progress) == 0:
            continue
        # 找组内最早的复习日期
        review_dates = [p.next_review_date for p in g.words_progress if p.current_stage < get_total_stages(user.review_intervals)]
        next_review = min(review_dates) if review_dates else None
        days_until = (next_review - today).days if next_review else None
        result.append({
            "id": g.id,
            "name": g.name,
            "word_count": len(g.words_progress),
            "created_at": str(g.created_at),
            "next_review_date": str(next_review) if next_review else None,
            "days_until_review": days_until,
            "needs_review": days_until is not None and days_until <= 0,
        })
    return result


@router.get("/groups/learning")
def get_learning_groups(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """在学的组（组内有未掌握的词）"""
    today = date.today()
    groups = (
        db.query(LearningGroup)
        .filter(LearningGroup.user_id == user.id)
        .order_by(LearningGroup.created_at.desc())
        .all()
    )
    result = []
    total_stages = get_total_stages(user.review_intervals)
    for g in groups:
        learning_count = sum(1 for p in g.words_progress if p.current_stage < total_stages)
        if learning_count > 0:
            review_dates = [p.next_review_date for p in g.words_progress if p.current_stage < total_stages]
            next_review = min(review_dates) if review_dates else None
            days_until = (next_review - today).days if next_review else None
            result.append({
                "id": g.id,
                "name": g.name,
                "word_count": len(g.words_progress),
                "learning_count": learning_count,
                "created_at": str(g.created_at),
                "next_review_date": str(next_review) if next_review else None,
                "days_until_review": days_until,
                "needs_review": days_until is not None and days_until <= 0,
            })
    return result


@router.get("/groups/{group_id}/words")
def get_group_words(
    group_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """某组的单词列表"""
    group = db.query(LearningGroup).filter(
        LearningGroup.id == group_id, LearningGroup.user_id == user.id
    ).first()
    if not group:
        raise HTTPException(status_code=404, detail="组不存在")
    return [
        {
            "id": p.word.id,
            "english": p.word.english,
            "chinese": p.word.chinese,
            "phonetic": p.word.phonetic,
            "chinese_explanation": p.word.chinese_explanation,
            "english_explanation": p.word.english_explanation,
            "example_sentence": p.word.example_sentence,
            "stage": p.current_stage,
        }
        for p in group.words_progress
    ]


@router.get("/groups/mastered")
def get_mastered_groups(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """已掌握的组（组内所有词都已掌握）"""
    groups = (
        db.query(LearningGroup)
        .filter(LearningGroup.user_id == user.id)
        .order_by(LearningGroup.created_at.desc())
        .all()
    )
    result = []
    for g in groups:
        if len(g.words_progress) > 0 and all(p.current_stage >= get_total_stages(user.review_intervals) for p in g.words_progress):
            result.append({
                "id": g.id,
                "name": g.name,
                "word_count": len(g.words_progress),
                "created_at": str(g.created_at),
            })
    return result

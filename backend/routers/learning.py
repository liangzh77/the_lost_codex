import random
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, Word, UserWordProgress, LearningRecord
from auth import get_current_user
from services.spaced_repetition import get_next_review_date, is_mastered, TOTAL_STAGES

router = APIRouter(prefix="/api/learning", tags=["learning"])


class StartNewRequest(BaseModel):
    word_bank_id: int | None = None
    custom_words: list[str] | None = None  # 用户自定义输入的英文单词


class ConfirmDoneRequest(BaseModel):
    word_ids: list[int]


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
            UserWordProgress.current_stage < TOTAL_STAGES,
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
            UserWordProgress.current_stage < TOTAL_STAGES,
        )
        .count()
    )
    return {"count": count}


# ---------- 生成测试题 ----------

@router.get("/quiz/{word_id}")
def get_quiz(
    word_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """为单个单词生成一道四选一测试题"""
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="单词不存在")

    # 随机选题型
    quiz_type = random.choice(["cn_to_en", "en_to_cn", "en_to_explanation"])

    # 获取3个干扰项
    distractors = (
        db.query(Word)
        .filter(Word.id != word_id)
        .order_by(func.random())
        .limit(3)
        .all()
    )

    if quiz_type == "cn_to_en":
        question = word.chinese
        correct = word.english
        options = [w.english for w in distractors] + [correct]
    elif quiz_type == "en_to_cn":
        question = word.english
        correct = word.chinese
        options = [w.chinese for w in distractors] + [correct]
    else:
        question = word.english
        correct = word.chinese_explanation
        options = [w.chinese_explanation for w in distractors] + [correct]

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
    now = datetime.utcnow()

    for word_id in body.word_ids:
        progress = (
            db.query(UserWordProgress)
            .filter(UserWordProgress.user_id == user.id, UserWordProgress.word_id == word_id)
            .first()
        )
        if progress:
            # 已有进度，推进到下一阶段
            progress.current_stage += 1
            progress.next_review_date = get_next_review_date(progress.current_stage, today)
        else:
            # 新词，创建进度记录
            progress = UserWordProgress(
                user_id=user.id,
                word_id=word_id,
                current_stage=1,
                next_review_date=get_next_review_date(1, today),
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
            result.append({"id": w.id, "english": w.english, "chinese": w.chinese})
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
            UserWordProgress.current_stage < TOTAL_STAGES,
        )
        .all()
    )
    return [
        {"id": p.word.id, "english": p.word.english, "chinese": p.word.chinese, "stage": p.current_stage, "next_review": str(p.next_review_date)}
        for p in progress_list
    ]


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
            UserWordProgress.current_stage >= TOTAL_STAGES,
        )
        .all()
    )
    return [
        {"id": p.word.id, "english": p.word.english, "chinese": p.word.chinese}
        for p in progress_list
    ]

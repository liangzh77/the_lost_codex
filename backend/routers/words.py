from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import WordBank, Word, UserWordProgress
from auth import get_current_user, User
from services.ai_complete import complete_word_info

router = APIRouter(prefix="/api/words", tags=["words"])


@router.get("/banks")
def list_word_banks(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    banks = db.query(WordBank).order_by(WordBank.display_order).all()
    result = []
    for b in banks:
        total = db.query(func.count(Word.id)).filter(Word.word_bank_id == b.id).scalar()
        learned = (
            db.query(func.count(UserWordProgress.id))
            .join(Word, UserWordProgress.word_id == Word.id)
            .filter(Word.word_bank_id == b.id, UserWordProgress.user_id == user.id)
            .scalar()
        )
        result.append({"id": b.id, "name": b.name, "total": total, "learned": learned})
    return result


@router.get("/bank/{bank_id}")
def list_words_in_bank(bank_id: int, db: Session = Depends(get_db)):
    words = db.query(Word).filter(Word.word_bank_id == bank_id).all()
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


@router.get("/{word_id}")
def get_word(word_id: int, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="单词不存在")
    # 自动补全缺失的详细信息
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

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import WordBank, Word
from auth import get_current_user, User

router = APIRouter(prefix="/api/words", tags=["words"])


@router.get("/banks")
def list_word_banks(db: Session = Depends(get_db)):
    banks = db.query(WordBank).order_by(WordBank.display_order).all()
    return [{"id": b.id, "name": b.name} for b in banks]


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
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="单词不存在")
    return {
        "id": word.id,
        "english": word.english,
        "chinese": word.chinese,
        "phonetic": word.phonetic,
        "chinese_explanation": word.chinese_explanation,
        "english_explanation": word.english_explanation,
        "example_sentence": word.example_sentence,
    }

"""从数据库导出单词信息到 backend/data/banks/*.json"""
import json
import os
from database import SessionLocal
from models import WordBank, Word


def main():
    db = SessionLocal()
    banks = db.query(WordBank).order_by(WordBank.display_order).all()

    out_dir = os.path.join(os.path.dirname(__file__), "data", "banks")

    for bank in banks:
        words = (
            db.query(Word)
            .filter(Word.word_bank_id == bank.id)
            .all()
        )

        data = {
            "name": bank.name,
            "display_order": bank.display_order,
            "words": [
                {
                    "english": w.english,
                    "chinese": w.chinese or "",
                    "phonetic": w.phonetic or "",
                    "chinese_explanation": w.chinese_explanation or "",
                    "english_explanation": w.english_explanation or "",
                    "example_sentence": w.example_sentence or "",
                }
                for w in words
            ],
        }

        path = os.path.join(out_dir, f"{bank.name}.json")
        if os.path.exists(path):
            os.remove(path)

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"✓ {bank.name}: {len(words)} 个单词 → {path}")

    db.close()
    print(f"\n完成，共导出 {len(banks)} 个词库")


if __name__ == "__main__":
    main()

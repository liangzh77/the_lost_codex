import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base, SessionLocal
from models import WordBank, Word

def import_words(json_path: str):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 导入词库
    bank_map = {}
    for bank_info in data["word_banks"]:
        existing = db.query(WordBank).filter(WordBank.name == bank_info["name"]).first()
        if existing:
            bank_map[bank_info["name"]] = existing
        else:
            bank = WordBank(name=bank_info["name"], display_order=bank_info["display_order"])
            db.add(bank)
            db.flush()
            bank_map[bank_info["name"]] = bank

    # 导入单词
    count = 0
    for bank_name, words in data["words"].items():
        bank = bank_map[bank_name]
        for w in words:
            existing = db.query(Word).filter(
                Word.english == w["english"], Word.word_bank_id == bank.id
            ).first()
            if existing:
                continue
            word = Word(
                english=w["english"],
                chinese=w["chinese"],
                phonetic=w.get("phonetic", ""),
                chinese_explanation=w.get("chinese_explanation", ""),
                english_explanation=w.get("english_explanation", ""),
                example_sentence=w.get("example_sentence", ""),
                word_bank_id=bank.id,
            )
            db.add(word)
            count += 1

    db.commit()
    db.close()
    print(f"导入完成：{count} 个新单词")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "test_words.json")
    import_words(path)

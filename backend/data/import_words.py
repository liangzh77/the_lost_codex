import json
import sys
import os
import glob

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base, SessionLocal
from models import WordBank, Word


def import_bank_file(db, json_path: str) -> int:
    """导入单个词库文件，返回新增单词数"""
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    name = data["name"]
    display_order = data.get("display_order", 0)

    existing = db.query(WordBank).filter(WordBank.name == name).first()
    if existing:
        bank = existing
    else:
        bank = WordBank(name=name, display_order=display_order)
        db.add(bank)
        db.flush()

    count = 0
    for w in data.get("words", []):
        if db.query(Word).filter(Word.english == w["english"], Word.word_bank_id == bank.id).first():
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

    return count


def import_from_dir(banks_dir: str):
    """从 banks 目录导入所有词库文件"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    total = 0

    files = sorted(glob.glob(os.path.join(banks_dir, "*.json")))
    for f in files:
        count = import_bank_file(db, f)
        name = os.path.basename(f).replace(".json", "")
        print(f"  {name}: +{count}")
        total += count

    db.commit()
    db.close()
    print(f"导入完成：{total} 个新单词（{len(files)} 个词库）")


def import_full_file(json_path: str):
    """从 words_full.json 导入（兼容旧格式）"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

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

    count = 0
    for bank_name, words in data["words"].items():
        bank = bank_map[bank_name]
        for w in words:
            if db.query(Word).filter(Word.english == w["english"], Word.word_bank_id == bank.id).first():
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
    data_dir = os.path.dirname(os.path.abspath(__file__))
    banks_dir = os.path.join(data_dir, "banks")

    if len(sys.argv) > 1:
        # 指定文件则按旧方式导入
        import_full_file(sys.argv[1])
    elif os.path.isdir(banks_dir):
        # 默认从 banks 目录导入
        import_from_dir(banks_dir)
    else:
        # 回退到 words_full.json
        import_full_file(os.path.join(data_dir, "words_full.json"))

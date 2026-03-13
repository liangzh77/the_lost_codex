"""从 wordlists/*.txt 导入单词列表（只有英文，详细信息后续 AI 补全）"""
import os
import sys
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base, SessionLocal
from models import WordBank, Word

# 文件名到词库名和排序的映射
BANK_MAP = {
    "01_小学单词": ("小学单词", 1),
    "02_初一新增": ("初一新增", 2),
    "03_初二新增": ("初二新增", 3),
    "04_初三新增": ("初三新增", 4),
    "05_高一新增": ("高一新增", 5),
    "06_高二新增": ("高二新增", 6),
    "07_高三新增": ("高三新增", 7),
    "08_四级新增": ("四级新增", 8),
    "09_六级新增": ("六级新增", 9),
    "10_托福": ("托福", 10),
    "11_雅思": ("雅思", 11),
}


def import_wordlists():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wordlists")
    total = 0

    for filename in sorted(os.listdir(data_dir)):
        if not filename.endswith(".txt"):
            continue
        stem = filename.replace(".txt", "")
        if stem not in BANK_MAP:
            continue

        bank_name, display_order = BANK_MAP[stem]
        filepath = os.path.join(data_dir, filename)

        # 读取单词列表
        with open(filepath, "r", encoding="utf-8") as f:
            words = [w.strip().lower() for w in f.read().split("\n") if w.strip()]

        # 创建或获取词库
        bank = db.query(WordBank).filter(WordBank.name == bank_name).first()
        if not bank:
            bank = WordBank(name=bank_name, display_order=display_order)
            db.add(bank)
            db.flush()

        # 导入单词（只有英文，其他字段留空）
        count = 0
        for english in words:
            if db.query(Word).filter(Word.english == english, Word.word_bank_id == bank.id).first():
                continue
            word = Word(
                english=english,
                chinese="",
                phonetic="",
                chinese_explanation="",
                english_explanation="",
                example_sentence="",
                word_bank_id=bank.id,
            )
            db.add(word)
            count += 1

        total += count
        print(f"  {bank_name}: {len(words)} total, +{count} new")

    db.commit()
    db.close()
    print(f"导入完成：{total} 个新单词")


if __name__ == "__main__":
    import_wordlists()

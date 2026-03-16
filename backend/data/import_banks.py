"""Import word banks from data/banks/*.json into the database, replacing existing data."""
import json
import glob
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import engine, SessionLocal, Base
from models import WordBank, Word

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Delete all existing words and banks
deleted_words = db.query(Word).delete()
deleted_banks = db.query(WordBank).delete()
db.commit()
print(f"Cleared {deleted_banks} banks, {deleted_words} words")

bank_files = sorted(glob.glob(os.path.join(os.path.dirname(__file__), "banks", "*.json")))
print(f"Found {len(bank_files)} bank files")

total_words = 0
for filepath in bank_files:
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    bank_name = data["name"]
    display_order = data.get("display_order", 0)
    words = data["words"]

    bank = WordBank(name=bank_name, display_order=display_order)
    db.add(bank)
    db.flush()

    for w in words:
        word = Word(
            english=w["english"],
            chinese=w.get("chinese", ""),
            phonetic=w.get("phonetic", ""),
            chinese_explanation=w.get("chinese_explanation", ""),
            english_explanation=w.get("english_explanation", ""),
            example_sentence=w.get("example_sentence", ""),
            word_bank_id=bank.id,
        )
        db.add(word)

    total_words += len(words)
    print(f"  Imported '{bank_name}': {len(words)} words")

db.commit()
db.close()
print(f"\nDone! Imported {total_words} words total.")

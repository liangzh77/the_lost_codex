from datetime import datetime, date
from sqlalchemy import String, Integer, ForeignKey, Date, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


from typing import Optional


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    group_size: Mapped[int] = mapped_column(Integer, default=10)
    review_intervals: Mapped[str] = mapped_column(String(200), default="1,2,4,7,15,30")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    progress: Mapped[list["UserWordProgress"]] = relationship(back_populates="user")
    records: Mapped[list["LearningRecord"]] = relationship(back_populates="user")
    groups: Mapped[list["LearningGroup"]] = relationship(back_populates="user")


class WordBank(Base):
    __tablename__ = "word_banks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    words: Mapped[list["Word"]] = relationship(back_populates="word_bank")


class Word(Base):
    __tablename__ = "words"

    id: Mapped[int] = mapped_column(primary_key=True)
    english: Mapped[str] = mapped_column(String(100), index=True)
    chinese: Mapped[str] = mapped_column(String(200))
    phonetic: Mapped[str] = mapped_column(String(100), default="")
    chinese_explanation: Mapped[str] = mapped_column(Text, default="")
    english_explanation: Mapped[str] = mapped_column(Text, default="")
    example_sentence: Mapped[str] = mapped_column(Text, default="")
    word_bank_id: Mapped[int] = mapped_column(ForeignKey("word_banks.id"))

    word_bank: Mapped["WordBank"] = relationship(back_populates="words")


class UserWordProgress(Base):
    __tablename__ = "user_word_progress"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    word_id: Mapped[int] = mapped_column(ForeignKey("words.id"), index=True)
    current_stage: Mapped[int] = mapped_column(Integer, default=0)
    next_review_date: Mapped[date] = mapped_column(Date)
    group_id: Mapped[Optional[int]] = mapped_column(ForeignKey("learning_groups.id"), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    user: Mapped["User"] = relationship(back_populates="progress")
    word: Mapped["Word"] = relationship()
    group: Mapped[Optional["LearningGroup"]] = relationship(back_populates="words_progress")


class LearningRecord(Base):
    __tablename__ = "learning_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    word_id: Mapped[int] = mapped_column(ForeignKey("words.id"), index=True)
    studied_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    stage_at_time: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="records")
    word: Mapped["Word"] = relationship()


class LearningGroup(Base):
    __tablename__ = "learning_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    user: Mapped["User"] = relationship(back_populates="groups")
    words_progress: Mapped[list["UserWordProgress"]] = relationship(back_populates="group")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base
from routers import users, words, learning, growth, audio

app = FastAPI(title="The Lost Codex", description="脑空白 — 背单词应用")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(words.router)
app.include_router(learning.router)
app.include_router(growth.router)
app.include_router(audio.router)


def _migrate_add_wechat_fields():
    """一次性迁移：为 users 表添加微信字段（SQLite ALTER TABLE，幂等）"""
    with engine.connect() as conn:
        existing = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        for col, typedef in [
            ("openid", "TEXT UNIQUE"),
            ("display_name", "TEXT"),
            ("avatar_url", "TEXT"),
        ]:
            if col not in existing:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {typedef}"))
        conn.commit()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    _migrate_add_wechat_fields()


@app.get("/")
def root():
    return {"message": "The Lost Codex API"}

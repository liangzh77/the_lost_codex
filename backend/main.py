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


def _migrate(table: str, columns: list[tuple[str, str]]):
    """幂等地为指定表添加列（SQLite ALTER TABLE）。
    SQLite 不支持 ALTER TABLE ADD COLUMN ... UNIQUE，添加时自动去掉 UNIQUE 约束。"""
    with engine.connect() as conn:
        existing = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))}
        for col, typedef in columns:
            if col not in existing:
                # SQLite 不支持 ADD COLUMN UNIQUE，去掉后添加列
                safe_typedef = typedef.replace("UNIQUE", "").strip()
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {safe_typedef}"))
        conn.commit()


def _migrate_add_wechat_fields():
    """一次性迁移：为各表添加缺失列（幂等）"""
    _migrate("users", [
        ("openid", "TEXT UNIQUE"),
        ("display_name", "TEXT"),
        ("avatar_url", "TEXT"),
    ])
    _migrate("learning_records", [
        ("imprints", "INTEGER DEFAULT 0"),
    ])


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    _migrate_add_wechat_fields()


@app.get("/")
def root():
    return {"message": "The Lost Codex API"}

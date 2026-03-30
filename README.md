# The Lost Codex（脑空白）

用艾宾浩斯间隔重复法背单词的 Web 应用。支持自定义词库、四选一测验、拼写记忆游戏，以及词形归一化——输入 walked 或 children，自动识别为 walk 和 child。

## 技术栈

- **后端**：FastAPI + SQLite（SQLAlchemy）+ NLTK WordNet
- **前端**：React + TypeScript + Vite + Tailwind CSS
- **认证**：JWT + bcrypt

## 快速启动

```bash
# Windows 双击运行（同时启动前后端）
start.bat
```

或手动分别启动：

```bash
# 后端（http://localhost:8000）
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# 前端（http://localhost:5173）
cd frontend
npm install
npm run dev
```

首次运行后端时，NLTK 会自动下载 WordNet 语料库（约 10MB）。

## 项目结构

```
the_lost_codex/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── models.py            # ORM 模型（users, words, progress 等）
│   ├── routers/
│   │   ├── learning.py      # 学新词、复习、测验 API
│   │   ├── words.py         # 词库查询 API
│   │   └── users.py         # 注册/登录 API
│   ├── services/
│   │   ├── lemmatize.py     # 词形归一化（walked→walk）
│   │   ├── spaced_repetition.py  # 艾宾浩斯间隔算法
│   │   └── audio_service.py # 单词发音
│   └── tests/               # pytest 单元测试
├── frontend/
│   └── src/
│       ├── pages/           # 各功能页面
│       ├── components/      # 通用组件
│       └── api/             # 后端 API 封装
├── start.bat                # 一键启动脚本（Windows）
├── CHANGELOG.md             # 版本变更记录
└── TASKS.md                 # 功能开发进度
```

## 主要功能

- **间隔重复**：基于艾宾浩斯曲线（1/2/4/7/15/30 天）安排复习
- **词形归一化**：输入任意时态/复数/比较级，自动归为词元形式
- **四选一测验**：后续复习使用选择题，学完才确认掌握
- **记忆游戏**：翻牌配对游戏强化记忆
- **自定义词库**：支持用户输入任意单词，自动查词典补全释义
- **学习统计**：记录学习轨迹和正确率

## 运行测试

```bash
cd backend
pytest tests/
```

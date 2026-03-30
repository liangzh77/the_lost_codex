# The Lost Codex (脑空白) — 开发任务

## P0 — 后端基础 ✅
- [x] 项目结构（backend/）
- [x] database.py — SQLite 引擎、Session、Base
- [x] models.py — 5 张表 ORM 模型（users, word_banks, words, user_word_progress, learning_records）
- [x] schemas.py — Pydantic 请求/响应模型
- [x] auth.py — JWT + bcrypt 认证
- [x] routers/users.py — 注册/登录/获取用户信息/设置 API
- [x] main.py — FastAPI 入口，CORS，startup 建表
- [x] requirements.txt

## P1 — 核心功能 API ✅
- [x] services/spaced_repetition.py — 艾宾浩斯间隔重复算法（1,2,4,7,15,30天）
- [x] routers/words.py — 词库列表、单词查询 API
- [x] routers/learning.py — 学新词、今日复习、测试题生成、确认学完、单词列表 API
- [x] data/import_words.py — 词库导入脚本
- [x] data/test_words.json — 测试词库（小学10词 + 初一5词）

## P2 — 前端基础 ✅
- [x] Vite + React + TypeScript + Tailwind 初始化
- [x] Apple 风格基础组件（Button, Card, Modal, NavBar, TabBar, WordCard）
- [x] API 调用封装 frontend/src/api/
- [x] 路由配置、Auth context
- [x] 登录/注册页

## P3 — 学习流程页面 ✅
- [x] 首页（今日待复习数、新词入口）
- [x] 学习会话页
  - [x] 第一次学习：展示完整单词卡片
  - [x] 后续学习：四选一测试题（不展示完整信息）
  - [x] 用户可反复学习，点"学完了"确认
  - [x] 任意时刻点击单词弹出完整信息卡片
- [x] 词库选择 + 自定义输入单词
- [x] 复习页面

## P4 — 单词管理页面 ✅
- [x] 最近背的单词列表
- [x] 正在背诵的单词列表
- [x] 已掌握的单词列表
- [x] 设置页（词库选择、每组数量）

## P5 — 词库数据 ✅
- [x] 整理各级别词库（小学→雅思，11个词库共330词）
- [x] 批量导入脚本（默认导入 words_full.json）
- [x] data/generate_words.py — 词库生成脚本

## P6.5 — 词形归一化 ✅
- [x] backend/services/lemmatize.py — 基于 NLTK WordNet 的词形归一化服务
  - 动词变形：walked→walk, running→run, ran→run（含不规则）
  - 名词复数：children→child, mice→mouse, cats→cat
  - 形容词比较级：bigger→big
  - 所有格处理：running's→run
  - NLTK 不可用时降级为无归一化模式，不影响现有功能
- [x] normalize_words() helper：批量归一化 + 保序去重
- [x] POST /api/learning/check-words：用户输入先归一化，按词元查词库
- [x] POST /api/learning/new（自定义词路径）：创建词元词条而非变形词
- [x] 25 个单元测试覆盖全部代码路径（backend/tests/test_lemmatize.py）

## P6 — Bug 修复 & 体验优化 ✅
- [x] 后端：最近背的单词列表返回 studied_at 字段
- [x] 后端：四选一测验干扰项去重，不足时兼容处理
- [x] 后端：自定义单词未找到时返回 404 提示
- [x] 后端：新增 /api/learning/stats 学习统计 API
- [x] 后端：/api/words/banks 返回每个词库的总词数和已学数
- [x] 前端：AuthContext 新增 refreshUser，设置保存后同步用户数据
- [x] 前端：首页显示在学/已掌握统计卡片
- [x] 前端：词库选择页显示进度条（已学/总数）
- [x] 前端：学习会话答错时显示正确答案和单词详情
- [x] 前端：学习完成页显示答题正确率
- [x] 前端：测验加载时显示 loading 状态

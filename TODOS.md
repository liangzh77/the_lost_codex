# TODOS

## [ ] 清理历史变形词条（历史数据迁移）

**What:** 查询数据库中已存在的变形词条（如 "walked"、"running"），将其合并到对应词元词条（"walk"、"run"），并删除孤立变形词条。

**Why:** 词形归一化功能（2026-03-28 上线）防止了新增变形词条，但历史上用户已输入的变形词条仍保留在 DB 中，可能导致旧词库里有重复学习。

**Pros:**
- 词库干净：消除所有历史碎片
- `check-words` 不会再误报变形词为"未学过"

**Cons:**
- 需要手工确认哪些词条是真正的"变形"（某些词既是词元也是变形，如 "set"）
- 用户学习进度（UserWordProgress）要跟着迁移或重置，有数据风险

**Context:**
词形归一化上线后，新输入的词会自动归一化到词元。但 DB 里已有的变形词条（如果用户在此功能上线前输入过"walked"）不会自动清理。清理脚本思路：`SELECT english FROM words WHERE english != lemmatize(english)`，人工审核后批量更新。
实现起点：`backend/services/lemmatize.py` 的 `get_lemma()` 函数可复用。

**Depends on:** 词形归一化功能上线后（PR 合并后）再做，避免并行修改冲突。

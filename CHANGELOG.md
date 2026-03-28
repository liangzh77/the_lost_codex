# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0.0] - 2026-03-28

### Added
- 词形归一化服务 (`backend/services/lemmatize.py`)：基于 NLTK WordNet，将用户输入的变形词自动还原为字典词元
  - 动词变形：walked→walk, running→run, ran→run（含不规则）
  - 名词复数：children→child, mice→mouse, cats→cat
  - 形容词比较级：bigger→big
  - 所有格处理：running's→run
  - NLTK 不可用时降级为无归一化模式，不影响现有功能
- `normalize_words()` helper：批量归一化 + 保序去重
- 25 个单元测试覆盖全部代码路径
- TODOS.md 记录历史变形词条清理事项

### Changed
- `POST /api/learning/check-words`：输入词先归一化，返回词元形式；新增 `normalized` 响应字段
- `POST /api/learning/new`（custom_words 路径）：用户输入先归一化，确保创建词元词条而非变形词

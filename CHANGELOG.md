# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0.0] - 2026-03-28

### Added
- **词形归一化**：输入 walked、running、children，系统自动识别为 walk、run、child——无论你输哪种时态或复数，都能学到正确的词元形式
  - 支持：动词变形（walked→walk、ran→run）、名词复数（children→child、mice→mouse）、形容词比较级（bigger→big）、所有格（running's→run）
  - NLTK 不可用时自动降级，不影响现有功能
- 重复词自动合并：同时输入 walked 和 walk，只会学习一个词条 walk
- 25 个单元测试，覆盖全部归一化逻辑

### Changed
- 查词接口（`check-words`）现在返回归一化后的词元，并附带 `normalized` 字段说明哪些词发生了变形还原
- 自定义添加单词时，自动归一化为词元形式，避免 walked 和 walk 被当作两个不同单词收录

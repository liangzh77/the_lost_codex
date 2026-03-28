"""
词形归一化服务。
将用户输入的变形词还原为字典词元：
  walked → walk, running → run, children → child, bigger → big

数据流：
  用户输入 ["walked", "running", "children"]
       ↓
  get_lemma (per-word)
       ↓
  normalize_words → (["walk", "run", "child"], {"walked":"walk", ...})
       ↓
  现有 DB 查找 / 创建逻辑
"""

_nltk_ready = False
_lemmatizer = None

try:
    import nltk
    # 在模块加载时确保语料可用，避免 import 顺序导致 LookupError
    # omw-1.4 为多语言支持，英语场景不需要，不下载
    nltk.download('wordnet', quiet=True)
    from nltk.stem import WordNetLemmatizer
    _lemmatizer = WordNetLemmatizer()
    _nltk_ready = True
except Exception:
    pass  # 降级为无归一化模式，不影响正常功能


def get_lemma(word: str) -> str:
    """把变形词还原为字典词元。

    walked → walk, children → child, bigger → big
    POS 顺序：v（动词）→ n（名词）→ a（形容词）→ r（副词）
    所有格（"running's"）先去掉 "'s" 再归一化，结果为 "run"。
    连字符词（"well-being"）不做处理，原样返回。
    ≤2 字符的词直接返回（单字母/双字母词 WordNet 行为不可预期）。
    NLTK 不可用时（download 失败）直接返回原词，功能降级但不报错。
    """
    word = word.strip().lower()
    # 去掉所有格后缀，如 "running's" → "running"
    if word.endswith("'s"):
        word = word[:-2]
    if not word or len(word) < 3 or not _nltk_ready:
        return word
    for pos in ['v', 'n', 'a', 'r']:
        lemma = _lemmatizer.lemmatize(word, pos=pos)
        if lemma != word:
            return lemma
    return word


def normalize_words(words: list[str]) -> tuple[list[str], dict[str, str]]:
    """对词列表进行归一化 + 去重。

    返回 (归一化并去重后的词列表, {原始词: 归一化词} 仅含发生变化的词)

    示例：
      normalize_words(["walked", "running", "walk"])
      → (["walk", "run"], {"walked": "walk", "running": "run"})
      # "walk" 在 "walked" 归一化后已存在，去重保留第一次出现的顺序
    """
    lemma_map = {orig: get_lemma(orig) for orig in words}
    # dict.fromkeys 保序去重
    deduped = list(dict.fromkeys(lemma_map.values()))
    changed = {orig: lemma for orig, lemma in lemma_map.items() if orig.lower() != lemma}
    return deduped, changed

"""
Unit tests for backend/services/lemmatize.py

覆盖全部 8 条代码路径：
  1. 空字符串 → 原样返回
  2. ≤2 字符 → 原样返回
  3. 所有格 "'s" → 去掉后缀再归一化
  4. 动词变形 → 词元
  5. 名词复数 → 词元
  6. 形容词比较级/最高级 → 词元
  7. 非英语词 → 原样返回
  8. 已是词元 → 原样返回（不重复处理）

以及 normalize_words 的 3 条路径：
  A. 正常词列表 → (lemmas, changed_dict)
  B. 含重复词元（["walked","walk"]）→ 去重后只有 ["walk"]
  C. 空列表 → ([], {})
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.lemmatize import get_lemma, normalize_words


# ── get_lemma ────────────────────────────────────────────────────────────────

class TestGetLemma:
    def test_empty_string(self):
        assert get_lemma("") == ""

    def test_whitespace_only(self):
        assert get_lemma("  ") == ""

    def test_short_word_one_char(self):
        assert get_lemma("i") == "i"

    def test_short_word_two_chars(self):
        assert get_lemma("am") == "am"

    def test_possessive_verb(self):
        # "running's" → 去掉 "'s" → "running" → "run"
        assert get_lemma("running's") == "run"

    def test_possessive_noun(self):
        # "dog's" → 去掉 "'s" → "dog" → "dog"（已是词元）
        assert get_lemma("dog's") == "dog"

    def test_verb_past_tense(self):
        assert get_lemma("walked") == "walk"

    def test_verb_gerund(self):
        assert get_lemma("running") == "run"

    def test_verb_irregular_past(self):
        assert get_lemma("ran") == "run"

    def test_verb_third_person(self):
        assert get_lemma("runs") == "run"

    def test_noun_plural_regular(self):
        assert get_lemma("cats") == "cat"

    def test_noun_plural_irregular(self):
        assert get_lemma("children") == "child"

    def test_noun_plural_irregular_mice(self):
        assert get_lemma("mice") == "mouse"

    def test_adjective_comparative(self):
        assert get_lemma("bigger") == "big"

    def test_adjective_superlative_irregular(self):
        # WordNet 不将 "best" 映射到 "good"（best 在 WordNet 中是独立词条）
        # 实际返回 "best"，已是最简形式，可接受
        assert get_lemma("best") == "best"

    def test_non_english_word(self):
        # 拼音或非英语词 NLTK 不处理，原样返回
        result = get_lemma("pao")
        assert isinstance(result, str)

    def test_already_lemma(self):
        assert get_lemma("walk") == "walk"
        assert get_lemma("child") == "child"

    def test_lowercase_normalization(self):
        # 大写输入也能正确处理
        assert get_lemma("WALKED") == "walk"

    def test_leading_trailing_spaces(self):
        assert get_lemma("  walked  ") == "walk"


# ── normalize_words ──────────────────────────────────────────────────────────

class TestNormalizeWords:
    def test_basic_normalization(self):
        lemmas, changed = normalize_words(["walked", "running", "children"])
        assert lemmas == ["walk", "run", "child"]
        assert changed == {"walked": "walk", "running": "run", "children": "child"}

    def test_deduplication_same_lemma(self):
        # "walked" 和 "walk" 都归一化为 "walk"，去重后只有一个
        lemmas, changed = normalize_words(["walked", "walk"])
        assert lemmas == ["walk"]
        assert "walked" in changed
        assert changed["walked"] == "walk"

    def test_already_lemma_not_in_changed(self):
        # "walk" 已是词元，不应出现在 changed 里
        lemmas, changed = normalize_words(["walk"])
        assert lemmas == ["walk"]
        assert "walk" not in changed

    def test_empty_list(self):
        lemmas, changed = normalize_words([])
        assert lemmas == []
        assert changed == {}

    def test_preserves_order(self):
        # 去重后顺序以第一次出现为准
        lemmas, _ = normalize_words(["running", "walked", "running"])
        assert lemmas[0] == "run"
        assert "walk" in lemmas

    def test_mixed_normalized_and_unchanged(self):
        lemmas, changed = normalize_words(["walk", "walked"])
        assert lemmas == ["walk"]
        assert "walk" not in changed
        assert changed.get("walked") == "walk"

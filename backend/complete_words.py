"""批量调用豆包大模型补全单词信息，自适应批次大小"""
import json
import time
import requests
from database import SessionLocal
from models import Word

ARK_API_URL = "https://ark.cn-beijing.volces.com/api/v3/responses"
ARK_API_KEY = "3ecc5d48-8986-4027-a052-2f63010e2f3d"
ARK_MODEL = "doubao-seed-2-0-pro-260215"

BATCH_SIZES = [10, 5, 3, 2, 1]


def build_prompt(words: list[str]) -> str:
    word_list = ", ".join(f'"{w}"' for w in words)
    return f"""请为以下英语单词提供信息，以 JSON 数组格式返回，不要包含其他内容。
单词列表: [{word_list}]

返回格式（JSON数组，每个元素对应一个单词）:
[
  {{
    "english": "单词原文",
    "chinese": "中文翻译",
    "phonetic": "国际音标，如 /ˈæp.əl/",
    "chinese_explanation": "简短中文解释（10字以内）",
    "english_explanation": "简短英文解释（10词以内）",
    "example_sentence": "一个简单的英文例句"
  }}
]"""


def call_api(prompt: str) -> list[dict] | None:
    """调用API，返回解析后的列表，失败返回None"""
    try:
        resp = requests.post(
            ARK_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ARK_API_KEY}",
            },
            json={
                "model": ARK_MODEL,
                "input": [
                    {
                        "role": "user",
                        "content": [{"type": "input_text", "text": prompt}],
                    }
                ],
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()

        for item in data.get("output", []):
            if item.get("type") == "message":
                content = item["content"][0]["text"]
                # 找到JSON数组
                start = content.find("[")
                end = content.rfind("]") + 1
                if start >= 0 and end > start:
                    result = json.loads(content[start:end])
                    if isinstance(result, list) and len(result) > 0:
                        return result
        return None
    except Exception as e:
        print(f"  [API错误] {e}")
        return None


def complete_batch(words: list[Word], batch_size_idx: int = 0) -> int:
    """尝试补全一批单词，返回成功数量。失败时自动减小批次。"""
    if batch_size_idx >= len(BATCH_SIZES):
        print(f"  [跳过] 所有批次大小都失败")
        return 0

    batch_size = BATCH_SIZES[batch_size_idx]
    english_list = [w.english for w in words[:batch_size]]

    print(f"  尝试批次大小={batch_size}: {english_list}")
    prompt = build_prompt(english_list)
    result = call_api(prompt)

    if result is None:
        print(f"  批次大小={batch_size} 失败，缩小批次...")
        # 递归尝试更小的批次
        return complete_batch(words, batch_size_idx + 1)

    # 解析结果，按english匹配更新
    result_map = {}
    for item in result:
        eng = item.get("english", "").strip().lower()
        if eng and item.get("chinese"):
            result_map[eng] = item

    success = 0
    for w in words[:batch_size]:
        info = result_map.get(w.english.lower())
        if info and info.get("chinese"):
            w.chinese = info["chinese"]
            w.phonetic = info.get("phonetic", "")
            w.chinese_explanation = info.get("chinese_explanation", "")
            w.english_explanation = info.get("english_explanation", "")
            w.example_sentence = info.get("example_sentence", "")
            success += 1
            print(f"    ✓ {w.english} → {info['chinese']}")
        else:
            print(f"    ✗ {w.english} 未找到匹配结果")

    return success


def main():
    db = SessionLocal()

    # 查找缺少中文信息的单词
    incomplete = (
        db.query(Word)
        .filter((Word.chinese == None) | (Word.chinese == ""))
        .all()
    )

    total = len(incomplete)
    if total == 0:
        print("所有单词已有完整信息，无需补全。")
        db.close()
        return

    print(f"找到 {total} 个需要补全的单词\n")

    completed = 0
    i = 0
    while i < total:
        remaining = incomplete[i:]
        batch_size = min(BATCH_SIZES[0], len(remaining))
        batch = remaining[:batch_size]

        print(f"\n[{i + 1}-{i + len(batch)}/{total}] 处理中...")
        success = complete_batch(batch, 0)
        completed += success

        # 提交数据库
        db.commit()

        i += len(batch)

        # 限速
        if i < total:
            time.sleep(0.5)

    db.close()
    print(f"\n完成！共补全 {completed}/{total} 个单词")


if __name__ == "__main__":
    main()

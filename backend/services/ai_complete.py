"""调用豆包大模型补全单词信息"""
import json
import requests

ARK_API_URL = "https://ark.cn-beijing.volces.com/api/v3/responses"
ARK_API_KEY = "3ecc5d48-8986-4027-a052-2f63010e2f3d"
ARK_MODEL = "doubao-seed-2-0-pro-260215"


def complete_word_info(english: str) -> dict:
    """用大模型生成单词的完整信息"""
    prompt = f"""请为英语单词 "{english}" 提供以下信息，以 JSON 格式返回，不要包含其他内容：
{{
  "chinese": "中文翻译",
  "phonetic": "国际音标，如 /ˈæp.əl/",
  "chinese_explanation": "简短中文解释（10字以内）",
  "english_explanation": "简短英文解释（10词以内）",
  "example_sentence": "一个简单的英文例句"
}}"""

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
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        # 找到 type=message 的 output
        for item in data.get("output", []):
            if item.get("type") == "message":
                content = item["content"][0]["text"]
                start = content.find("{")
                end = content.rfind("}") + 1
                if start >= 0 and end > start:
                    return json.loads(content[start:end])
    except Exception as e:
        print(f"[AI补全失败] {english}: {e}")

    return {
        "chinese": "",
        "phonetic": "",
        "chinese_explanation": "",
        "english_explanation": "",
        "example_sentence": "",
    }

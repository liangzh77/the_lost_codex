import requests
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import FileResponse

AUDIO_DIR = Path(__file__).parent.parent / 'audio'
AUDIO_DIR.mkdir(exist_ok=True)


def get_audio_url_from_api(word: str) -> str | None:
    """从 Free Dictionary API 获取单词发音 URL"""
    try:
        url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return None

        data = resp.json()
        if not data or not isinstance(data, list):
            return None

        # 收集所有音频 URL
        audio_urls = []
        for entry in data:
            if 'phonetics' in entry:
                for phonetic in entry['phonetics']:
                    if 'audio' in phonetic and phonetic['audio']:
                        audio_urls.append(phonetic['audio'])

        if not audio_urls:
            return None

        # 优先级：us > uk > au > 其他
        for suffix in ['-us.mp3', '-uk.mp3', '-au.mp3']:
            for url in audio_urls:
                if url.endswith(suffix):
                    return url

        # 没有匹配的，返回第一个
        return audio_urls[0]

    except Exception:
        return None


def download_and_cache_audio(word: str, url: str) -> Path | None:
    """下载音频文件并缓存"""
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code != 200:
            return None

        filename = f"{word.lower().replace(' ', '_')}.mp3"
        filepath = AUDIO_DIR / filename

        with open(filepath, 'wb') as f:
            f.write(resp.content)

        return filepath

    except Exception:
        return None


def get_word_audio(word: str) -> Path | None:
    """获取单词音频文件路径，不存在则下载"""
    filename = f"{word.lower().replace(' ', '_')}.mp3"
    filepath = AUDIO_DIR / filename

    # 已存在，直接返回
    if filepath.exists():
        return filepath

    # 不存在，从API获取并下载
    audio_url = get_audio_url_from_api(word)
    if not audio_url:
        return None

    return download_and_cache_audio(word, audio_url)

import requests
import time
import os
from pathlib import Path
from database import SessionLocal
from models import Word

def get_audio_url(word: str) -> str | None:
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

    except Exception as e:
        print(f"[错误] {word}: {e}")
        return None


def download_audio(word: str, url: str, output_dir: Path) -> bool:
    """下载音频文件"""
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code != 200:
            return False

        # 文件名：word.mp3
        filename = f"{word.lower().replace(' ', '_')}.mp3"
        filepath = output_dir / filename

        with open(filepath, 'wb') as f:
            f.write(resp.content)

        return True

    except Exception as e:
        print(f"[下载失败] {word}: {e}")
        return False


def main():
    db = SessionLocal()
    output_dir = Path(__file__).parent.parent / 'audio'
    output_dir.mkdir(exist_ok=True)

    words = db.query(Word).all()
    total = len(words)
    success = 0
    failed = 0

    print(f"开始下载 {total} 个单词的发音...")

    for i, word in enumerate(words, 1):
        english = word.english.strip()
        print(f"[{i}/{total}] {english}...", end=' ')

        # 检查是否已存在
        filename = f"{english.lower().replace(' ', '_')}.mp3"
        filepath = output_dir / filename
        if filepath.exists():
            print("已存在")
            success += 1
            continue

        # 获取音频 URL
        audio_url = get_audio_url(english)
        if not audio_url:
            print("无音频")
            failed += 1
            continue

        # 下载
        if download_audio(english, audio_url, output_dir):
            print(f"✓ {audio_url}")
            success += 1
        else:
            print("下载失败")
            failed += 1

        # 限速
        time.sleep(0.5)

    db.close()
    print(f"\n完成！成功: {success}, 失败: {failed}")
    print(f"音频文件保存在: {output_dir}")


if __name__ == '__main__':
    main()

"""从 Google TTS 下载所有单词的发音音频（跳过已有文件）"""
import requests
import time
from pathlib import Path
from database import SessionLocal
from models import Word

AUDIO_DIR = Path(__file__).parent / 'audio'
AUDIO_DIR.mkdir(exist_ok=True)


def download_from_google_tts(word: str, output_dir: Path) -> bool:
    """从 Google TTS 下载发音"""
    try:
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q={word}"
        resp = requests.get(url, timeout=15)
        if resp.status_code != 200 or len(resp.content) < 100:
            return False

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

    words = db.query(Word).all()
    total = len(words)
    skipped = 0
    success = 0
    failed = 0

    print(f"开始从 Google TTS 下载 {total} 个单词的发音...")

    for i, word in enumerate(words, 1):
        english = word.english.strip()
        filename = f"{english.lower().replace(' ', '_')}.mp3"
        filepath = AUDIO_DIR / filename

        if filepath.exists():
            skipped += 1
            continue

        print(f"[{i}/{total}] {english}...", end=' ')

        if download_from_google_tts(english, AUDIO_DIR):
            print("OK")
            success += 1
        else:
            print("FAIL")
            failed += 1

        time.sleep(0.1)

    db.close()
    print(f"\n完成！新下载: {success}, 已存在: {skipped}, 失败: {failed}")


if __name__ == '__main__':
    main()

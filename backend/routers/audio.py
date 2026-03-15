from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from services.audio_service import get_word_audio

router = APIRouter(prefix="/api/audio", tags=["audio"])


@router.get("/{word}")
def get_audio(word: str):
    """获取单词发音音频文件（自动下载并缓存）"""
    filepath = get_word_audio(word)
    if not filepath:
        raise HTTPException(status_code=404, detail="Audio not found")

    return FileResponse(
        filepath,
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=31536000"}
    )

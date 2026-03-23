import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from database import get_db
from models import User
from schemas import UserRegister, UserLogin, UserOut, Token, WechatToken, WechatLoginRequest, UserSettings
from auth import hash_password, verify_password, create_token, get_current_user

load_dotenv()
WECHAT_APP_ID = os.getenv("WECHAT_APP_ID", "")
WECHAT_APP_SECRET = os.getenv("WECHAT_APP_SECRET", "")
WECHAT_JSCODE2SESSION = "https://api.weixin.qq.com/sns/jscode2session"

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/register", response_model=Token)
def register(body: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在")
    user = User(username=body.username, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_token(user.id))


@router.post("/login", response_model=Token)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")
    return Token(access_token=create_token(user.id))


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/wechat-login", response_model=WechatToken)
def wechat_login(body: WechatLoginRequest, db: Session = Depends(get_db)):
    """微信小程序登录：code → openid → JWT"""
    if not WECHAT_APP_ID or not WECHAT_APP_SECRET:
        raise HTTPException(status_code=503, detail="微信登录未配置，请设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET")
    try:
        resp = httpx.get(
            WECHAT_JSCODE2SESSION,
            params={
                "appid": WECHAT_APP_ID,
                "secret": WECHAT_APP_SECRET,
                "js_code": body.code,
                "grant_type": "authorization_code",
            },
            timeout=5.0,
        )
        data = resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="微信服务超时，请稍后重试")
    except Exception:
        raise HTTPException(status_code=503, detail="微信服务异常，请稍后重试")

    if "errcode" in data and data["errcode"] != 0:
        raise HTTPException(status_code=400, detail=f"微信登录失败：{data.get('errmsg', '未知错误')}")

    openid = data.get("openid")
    if not openid:
        raise HTTPException(status_code=400, detail="微信返回数据异常")

    user = db.query(User).filter(User.openid == openid).first()
    is_new = user is None
    if is_new:
        username = f"wx_{openid[:8]}"
        # 处理极少概率的 username 冲突
        if db.query(User).filter(User.username == username).first():
            username = f"wx_{openid[:12]}"
        user = User(username=username, openid=openid, password_hash="")
        db.add(user)
        db.commit()
        db.refresh(user)

    return WechatToken(access_token=create_token(user.id), is_new_user=is_new)


@router.put("/settings", response_model=UserOut)
def update_settings(body: UserSettings, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.group_size is not None:
        user.group_size = body.group_size
    if body.review_intervals is not None:
        # 验证格式：逗号分隔的递增正整数
        try:
            nums = [int(x.strip()) for x in body.review_intervals.split(",")]
            assert all(n > 0 for n in nums)
            assert nums == sorted(nums)
            user.review_intervals = ",".join(str(n) for n in nums)
        except Exception:
            raise HTTPException(status_code=400, detail="记忆曲线格式错误，请输入逗号分隔的递增正整数")
    if body.display_name is not None:
        user.display_name = body.display_name
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    db.commit()
    db.refresh(user)
    return user

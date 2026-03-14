from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserRegister, UserLogin, UserOut, Token, UserSettings
from auth import hash_password, verify_password, create_token, get_current_user

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
    db.commit()
    db.refresh(user)
    return user

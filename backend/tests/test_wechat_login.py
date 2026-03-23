"""
Regression tests for POST /api/users/wechat-login
微信 API 调用使用 unittest.mock patch，不发真实网络请求
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from sqlalchemy.pool import StaticPool

# 内存 SQLite，每次测试独立 — 必须在 app/models 导入前定义
# StaticPool 确保所有连接共享同一个内存 DB，避免 create_all 和 Session 拿到不同连接
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# 导入 models 确保所有表定义注册到 Base，再导入 app
import models  # noqa: F401
from database import Base, get_db
from main import app


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    """每个测试拿一个干净的内存 DB + TestClient。
    把 main.engine 和 database.engine 都指向测试引擎，
    避免 startup 触碰生产 DB 文件。
    """
    import main as _main
    import database as _db

    # patch production engine → test engine in startup scope
    orig_main_engine = _main.engine if hasattr(_main, 'engine') else None
    orig_db_engine = _db.engine

    _db.engine = test_engine
    if hasattr(_main, 'engine'):
        _main.engine = test_engine

    Base.metadata.create_all(bind=test_engine)

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c

    Base.metadata.drop_all(bind=test_engine)

    # restore
    _db.engine = orig_db_engine
    if orig_main_engine is not None:
        _main.engine = orig_main_engine

MOCK_APP_ID = "wx_test_appid"
MOCK_APP_SECRET = "test_secret"


def _mock_wechat_ok(openid="test_openid_abc123"):
    """返回正常 openid 的微信 API mock"""
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"openid": openid, "session_key": "fake_session_key"}
    return mock_resp


def _mock_wechat_invalid_code():
    """返回 40029（code 无效）的微信 API mock"""
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"errcode": 40029, "errmsg": "invalid code"}
    return mock_resp


@patch("routers.users.WECHAT_APP_ID", MOCK_APP_ID)
@patch("routers.users.WECHAT_APP_SECRET", MOCK_APP_SECRET)
@patch("routers.users.httpx.get")
def test_wechat_login_new_user(mock_get, client):
    """新用户首次登录：创建 User，返回 JWT，is_new_user=True"""
    mock_get.return_value = _mock_wechat_ok("openid_new_user_001")

    resp = client.post("/api/users/wechat-login", json={"code": "valid_code_001"})

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["is_new_user"] is True
    assert data["token_type"] == "bearer"

    # 验证微信 API 被调用了一次，参数正确
    mock_get.assert_called_once()
    call_params = mock_get.call_args[1]["params"]
    assert call_params["js_code"] == "valid_code_001"
    assert call_params["appid"] == MOCK_APP_ID


@patch("routers.users.WECHAT_APP_ID", MOCK_APP_ID)
@patch("routers.users.WECHAT_APP_SECRET", MOCK_APP_SECRET)
@patch("routers.users.httpx.get")
def test_wechat_login_existing_user(mock_get, client):
    """已有用户再次登录：返回相同 user_id 的 JWT，is_new_user=False"""
    mock_get.return_value = _mock_wechat_ok("openid_existing_002")

    # 第一次登录
    resp1 = client.post("/api/users/wechat-login", json={"code": "code_first"})
    assert resp1.json()["is_new_user"] is True

    # 第二次登录（相同 openid）
    resp2 = client.post("/api/users/wechat-login", json={"code": "code_second"})
    assert resp2.status_code == 200
    data = resp2.json()
    assert data["is_new_user"] is False
    assert "access_token" in data


@patch("routers.users.WECHAT_APP_ID", MOCK_APP_ID)
@patch("routers.users.WECHAT_APP_SECRET", MOCK_APP_SECRET)
@patch("routers.users.httpx.get")
def test_wechat_login_invalid_code(mock_get, client):
    """无效 code：微信返回 40029，端点应返回 400"""
    mock_get.return_value = _mock_wechat_invalid_code()

    resp = client.post("/api/users/wechat-login", json={"code": "bad_code"})

    assert resp.status_code == 400
    assert "40029" in resp.json()["detail"] or "invalid" in resp.json()["detail"].lower()


@patch("routers.users.WECHAT_APP_ID", MOCK_APP_ID)
@patch("routers.users.WECHAT_APP_SECRET", MOCK_APP_SECRET)
@patch("routers.users.httpx.get")
def test_wechat_login_timeout(mock_get, client):
    """微信 API 超时：返回 503"""
    import httpx as _httpx
    mock_get.side_effect = _httpx.TimeoutException("timeout")

    resp = client.post("/api/users/wechat-login", json={"code": "any_code"})

    assert resp.status_code == 503
    assert "超时" in resp.json()["detail"]

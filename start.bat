@echo off
echo Starting The Lost Codex...

:: 启动后端
start "Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

:: 启动前端
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173

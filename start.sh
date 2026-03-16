#!/bin/bash
set -e

echo "======================================"
echo "  사내 자동화 프로젝트 관리 툴 시작"
echo "======================================"

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── 백엔드 ──────────────────────────────
echo "[1/4] 백엔드 패키지 설치 중..."
cd "$ROOT/backend"
pip3 install -r requirements.txt -q 2>/dev/null || python3 -m pip install -r requirements.txt -q

echo "[2/4] 백엔드 서버 시작 (http://localhost:8000)..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  백엔드 PID: $BACKEND_PID"

# ── 프론트엔드 ──────────────────────────
echo "[3/4] 프론트엔드 패키지 설치 중..."
cd "$ROOT/frontend"
npm install --silent

echo "[4/4] 프론트엔드 개발 서버 시작 (http://localhost:5173)..."
echo ""
echo "======================================"
echo "  브라우저에서 http://localhost:5173 접속"
echo "  종료: Ctrl+C"
echo "======================================"

# 종료 시 백엔드도 중지
trap "kill $BACKEND_PID 2>/dev/null; echo '서버 종료됨'" EXIT

npm run dev

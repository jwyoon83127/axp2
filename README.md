# 사내 자동화 프로젝트 관리 툴

## 실행 방법

### 방법 1: 한 번에 실행 (Mac/Linux)
```bash
chmod +x start.sh
./start.sh
```

### 방법 2: 백엔드/프론트엔드 각각 실행
```bash
# 터미널 1 - 백엔드
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# 터미널 2 - 프론트엔드
cd frontend
npm install
npm run dev
```

### 접속
- 프론트엔드: http://localhost:5173
- API 문서:   http://localhost:8000/docs

## 구조
```
automation_tool/
├── backend/
│   ├── main.py          # FastAPI 서버
│   ├── requirements.txt
│   └── data/            # JSON 데이터 저장소 (자동 생성)
├── frontend/
│   └── src/
│       ├── App.jsx                      # 메인 앱
│       ├── api.js                       # API 호출
│       └── components/
│           ├── TabDashboard.jsx         # 대시보드
│           ├── TabTeams.jsx             # 팀 현황
│           ├── TabDaily.jsx             # 데일리 체크
│           ├── TabTimeline.jsx          # 타임라인 (편집 가능)
│           └── TabTasks.jsx             # 업무 목록 (CRUD)
└── start.sh
```

## 주요 기능
- **타임라인 편집**: 주차·날짜·업무 추가/수정/삭제 가능
- **업무 목록 CRUD**: 자동화 업무 추가·상태 변경·삭제
- **데일리 체크**: 팀별 일일 진도 제출 및 이력 관리
- **팀 현황 업데이트**: 완료 건수·상태·이슈 실시간 저장
- **데이터 영속성**: JSON 파일로 자동 저장 (재시작 후에도 유지)

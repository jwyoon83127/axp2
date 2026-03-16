from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import json, uuid
from pathlib import Path
from datetime import datetime

app = FastAPI(title="사내 자동화 프로젝트 관리 API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# ── helpers ─────────────────────────────────────────────────────────────────
def load(name: str):
    p = DATA_DIR / f"{name}.json"
    return json.loads(p.read_text("utf-8")) if p.exists() else None

def save(name: str, data):
    (DATA_DIR / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")

def new_id(): return str(uuid.uuid4())[:8]

# ── 초기 데이터 ──────────────────────────────────────────────────────────────
DEFAULT_TEAMS = [
    {"id":1,"name":"개발팀","color":"#1F4E79","members":["김지원","류한경","신지원","윤주명","이경환","이우석","이윤형","장재인"],"totalTasks":303,"types":["업무 자동화","모니터링/알림","데이터 분석"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":2,"name":"운영개발팀","color":"#2E75B6","members":["강한경","김도아","김제은","김종민","문동주","이종욱","이효성"],"totalTasks":120,"types":["운영 관리","장애 대응","데이터 수집"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":3,"name":"세일즈팀","color":"#375623","members":["김민재","원희용","정희영","조윤호","한윤영"],"totalTasks":98,"types":["문서 작성","데이터 분석","고객 응대"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":4,"name":"TasOn개발팀","color":"#7030A0","members":["강주용","강호진","박기범","오병찬","유진영","윤진헌","조미현","최재호","최진영"],"totalTasks":77,"types":["개발 작업","업무 자동화","배포"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":5,"name":"TasOn서비스팀","color":"#C55A11","members":["안태연","이근우","한승주"],"totalTasks":45,"types":["고객 응대","모니터링","문서 작성"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":6,"name":"총무팀","color":"#ED7D31","members":["이석진"],"totalTasks":46,"types":["HR/채용","정산/결제","운영 관리"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":7,"name":"경영전략실","color":"#833C00","members":["이석진"],"totalTasks":31,"types":["데이터 분석","문서 작성"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":8,"name":"제품팀","color":"#4472C4","members":["조항진"],"totalTasks":30,"types":["업무 자동화","문서 작성"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":9,"name":"경영지원팀","color":"#70AD47","members":["장현희"],"totalTasks":12,"types":["문서 작성","데이터 분석"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":10,"name":"마케팅팀","color":"#D62728","members":["조정한","최현지"],"totalTasks":14,"types":["디자인/이미지","발송/알림"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":11,"name":"AX팀","color":"#0D4F8B","members":["이기한","조윤행","김철한"],"totalTasks":17,"types":["문서 작성","개발 작업","데이터 분석"],"completed":0,"status":"not_started","issues":False,"memo":""},
    {"id":12,"name":"기타","color":"#767171","members":["조미현"],"totalTasks":6,"types":["모니터링","데이터 수집","고객 응대"],"completed":0,"status":"not_started","issues":False,"memo":""},
]

DEFAULT_TIMELINE = [
    {"id":"w1","label":"1주차","range":"3/10 ~ 3/14","theme":"킥오프 & 준비","color":"#1F4E79","days":[
        {"id":"d1","date":"3/10","day":"화","tasks":[{"id":"t1","text":"전사 킥오프 미팅 개최 (전 팀 리더 필참)","done":False},{"id":"t2","text":"팀별 담당자 1인 확정","done":False},{"id":"t3","text":"데일리 체크 양식 배포","done":False}]},
        {"id":"d2","date":"3/11","day":"수","tasks":[{"id":"t4","text":"팀별 자동화 우선순위 자율 선정 및 AX팀 제출","done":False},{"id":"t5","text":"AI 툴 환경 점검","done":False}]},
        {"id":"d3","date":"3/12","day":"목","tasks":[{"id":"t6","text":"우선순위 검토 피드백 (AX팀)","done":False},{"id":"t7","text":"AI 툴 공통 교육 세션 (30분)","done":False}]},
        {"id":"d4","date":"3/13","day":"금","tasks":[{"id":"t8","text":"파일럿 대상 업무 최종 확정","done":False},{"id":"t9","text":"1주차 체크포인트 보고서 작성","done":False}]},
    ]},
    {"id":"w2","label":"2주차","range":"3/16 ~ 3/20","theme":"파일럿 자동화 실행","color":"#1A6B3A","days":[
        {"id":"d5","date":"3/16","day":"월","tasks":[{"id":"t10","text":"전 팀 파일럿 자동화 공식 시작","done":False},{"id":"t11","text":"AX팀 모니터링 채널 개시","done":False}]},
        {"id":"d6","date":"3/17","day":"화","tasks":[{"id":"t12","text":"데일리 체크 #1 제출 (오전 11시)","done":False},{"id":"t13","text":"AX팀 이슈 당일 해결 지원","done":False}]},
        {"id":"d7","date":"3/18","day":"수","tasks":[{"id":"t14","text":"데일리 체크 #2","done":False},{"id":"t15","text":"성공 사례 1~2건 전체 공유","done":False}]},
        {"id":"d8","date":"3/19","day":"목","tasks":[{"id":"t16","text":"데일리 체크 #3","done":False},{"id":"t17","text":"중간 성과 측정 (절감 시간·완료 건수)","done":False}]},
        {"id":"d9","date":"3/20","day":"금","tasks":[{"id":"t18","text":"2주차 주간 리뷰 (팀별 15분)","done":False},{"id":"t19","text":"3주차 확산 계획 안내","done":False}]},
    ]},
    {"id":"w3","label":"3주차","range":"3/23 ~ 3/27","theme":"전사 확산 & 정착","color":"#7B4F00","days":[
        {"id":"d10","date":"3/23","day":"월","tasks":[{"id":"t20","text":"2순위·3순위 업무로 확대","done":False},{"id":"t21","text":"팀 간 우수 사례 크로스 도입","done":False}]},
        {"id":"d11","date":"3/24","day":"화","tasks":[{"id":"t22","text":"데일리 체크 #4","done":False},{"id":"t23","text":"누적 절감 시간 집계","done":False}]},
        {"id":"d12","date":"3/25","day":"수","tasks":[{"id":"t24","text":"성과 사례 공유 세션 (30분, 전 팀)","done":False},{"id":"t25","text":"지식 베이스 초안 작성","done":False}]},
        {"id":"d13","date":"3/26","day":"목","tasks":[{"id":"t26","text":"데일리 체크 #5 (최종)","done":False},{"id":"t27","text":"전체 성과 데이터 취합 (AX팀)","done":False}]},
        {"id":"d14","date":"3/27","day":"금","tasks":[{"id":"t28","text":"최종 결과 보고회 (경영진 포함)","done":False},{"id":"t29","text":"우수 팀·개인 표창","done":False},{"id":"t30","text":"향후 운영 계획 확정","done":False}]},
    ]},
]

DEFAULT_AUTO_TASKS = [
    {"id":"at1","team":"마케팅팀","member":"조정한","name":"대외 행사 디자인","description":"부스, X배너, PPT, 팜플릿 디자인","frequency":"필요시","time":"30분~","programs":"Illustrator","type":"디자인/이미지 작업","difficulty":"하","aiTools":"Midjourney, Grok3","status":"pending"},
    {"id":"at2","team":"기타","member":"조미현","name":"유한킴벌리 CRM 발송 대행","description":"앱푸쉬, 알림톡, 문자, 메일 기획 및 발송 설정","frequency":"매일","time":"3시간 내","programs":"VNTG CRM, TMS, 엑셀","type":"모니터링/알림","difficulty":"하","aiTools":"n8n, claude cowork","status":"pending"},
    {"id":"at3","team":"기타","member":"조미현","name":"MA 고객사 캠페인 세팅/운영","description":"마케팅 자동화 시나리오 설정 및 상시 모니터링","frequency":"매일","time":"2시간 내","programs":"TMA","type":"모니터링/알림","difficulty":"하","aiTools":"n8n, claude cowork","status":"pending"},
    {"id":"at4","team":"AX팀","member":"이기한","name":"AI 서버 성능 보고서","description":"배포된 AI 모델, 컨테이너 상태 및 GPU 리소스 추적","frequency":"매일","time":"30분 이내","programs":"Claude Cowork, Docker","type":"모니터링/알림","difficulty":"하","aiTools":"n8n, claude cowork","status":"pending"},
    {"id":"at5","team":"AX팀","member":"이기한","name":"AI 트렌드 리서치","description":"AI 개발 동향 파악 및 뉴스레터/리포트 발행","frequency":"매주","time":"2시간 이내","programs":"Claude Code","type":"데이터 분석/리포팅","difficulty":"중","aiTools":"chatGpt Atlas, genspark Browser","status":"pending"},
    {"id":"at6","team":"AX팀","member":"조윤행","name":"일일 업무 일지 작성","description":"일일 업무 정리 및 작성","frequency":"매일","time":"10분","programs":"Jira, confluence","type":"업무 자동화","difficulty":"하","aiTools":"n8n, dify, claude cowork","status":"pending"},
]

def init_data():
    if load("teams") is None:    save("teams", DEFAULT_TEAMS)
    if load("timeline") is None: save("timeline", DEFAULT_TIMELINE)
    if load("daily_checks") is None: save("daily_checks", [])
    if load("auto_tasks") is None: save("auto_tasks", DEFAULT_AUTO_TASKS)

init_data()

# ══════════════════════════════════════════════════════════════════════════════
# MODELS
# ══════════════════════════════════════════════════════════════════════════════
class TeamUpdate(BaseModel):
    completed: Optional[int] = None
    status: Optional[str] = None
    issues: Optional[bool] = None
    memo: Optional[str] = None

class TimelineWeekCreate(BaseModel):
    label: str
    range: str
    theme: str
    color: str = "#2E75B6"

class TimelineDayCreate(BaseModel):
    date: str
    day: str

class TimelineTaskCreate(BaseModel):
    text: str

class TimelineTaskUpdate(BaseModel):
    text: Optional[str] = None
    done: Optional[bool] = None

class WeekUpdate(BaseModel):
    label: Optional[str] = None
    range: Optional[str] = None
    theme: Optional[str] = None
    color: Optional[str] = None

class DailyCheckCreate(BaseModel):
    date: str
    team: str
    member: str
    goal: str = ""
    done: str = ""
    issues: str = ""
    support: str = ""
    tomorrow: str = ""
    status: str = "completed"

class AutoTaskCreate(BaseModel):
    team: str
    member: str
    name: str
    description: str = ""
    frequency: str = ""
    time: str = ""
    programs: str = ""
    type: str = "업무 자동화"
    difficulty: str = "하"
    aiTools: str = ""
    status: str = "pending"
    weekId: Optional[str] = None   # 배정된 주차 ID

class AutoTaskUpdate(BaseModel):
    status: Optional[str] = None
    difficulty: Optional[str] = None
    aiTools: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    weekId: Optional[str] = None   # "" 이면 배정 해제

# ══════════════════════════════════════════════════════════════════════════════
# TEAMS
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/teams")
def get_teams():
    return load("teams")

@app.patch("/api/teams/{team_id}")
def update_team(team_id: int, body: TeamUpdate):
    teams = load("teams")
    t = next((t for t in teams if t["id"] == team_id), None)
    if not t: raise HTTPException(404, "Team not found")
    if body.completed is not None: t["completed"] = body.completed
    if body.status is not None:    t["status"]    = body.status
    if body.issues is not None:    t["issues"]    = body.issues
    if body.memo is not None:      t["memo"]      = body.memo
    save("teams", teams)
    return t

# ══════════════════════════════════════════════════════════════════════════════
# TIMELINE
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/timeline")
def get_timeline():
    return load("timeline")

@app.post("/api/timeline/weeks")
def add_week(body: TimelineWeekCreate):
    tl = load("timeline")
    new_week = {"id": new_id(), "label": body.label, "range": body.range,
                "theme": body.theme, "color": body.color, "days": []}
    tl.append(new_week)
    save("timeline", tl)
    return new_week

@app.patch("/api/timeline/weeks/{week_id}")
def update_week(week_id: str, body: WeekUpdate):
    tl = load("timeline")
    w = next((w for w in tl if w["id"] == week_id), None)
    if not w: raise HTTPException(404, "Week not found")
    for k, v in body.dict(exclude_none=True).items():
        w[k] = v
    save("timeline", tl)
    return w

@app.delete("/api/timeline/weeks/{week_id}")
def delete_week(week_id: str):
    tl = load("timeline")
    tl = [w for w in tl if w["id"] != week_id]
    save("timeline", tl)
    return {"ok": True}

@app.post("/api/timeline/weeks/{week_id}/days")
def add_day(week_id: str, body: TimelineDayCreate):
    tl = load("timeline")
    w = next((w for w in tl if w["id"] == week_id), None)
    if not w: raise HTTPException(404)
    new_day = {"id": new_id(), "date": body.date, "day": body.day, "tasks": []}
    w["days"].append(new_day)
    save("timeline", tl)
    return new_day

@app.delete("/api/timeline/weeks/{week_id}/days/{day_id}")
def delete_day(week_id: str, day_id: str):
    tl = load("timeline")
    w = next((w for w in tl if w["id"] == week_id), None)
    if not w: raise HTTPException(404)
    w["days"] = [d for d in w["days"] if d["id"] != day_id]
    save("timeline", tl)
    return {"ok": True}

@app.post("/api/timeline/weeks/{week_id}/days/{day_id}/tasks")
def add_task(week_id: str, day_id: str, body: TimelineTaskCreate):
    tl = load("timeline")
    w = next((w for w in tl if w["id"] == week_id), None)
    if not w: raise HTTPException(404)
    d = next((d for d in w["days"] if d["id"] == day_id), None)
    if not d: raise HTTPException(404)
    new_task = {"id": new_id(), "text": body.text, "done": False}
    d["tasks"].append(new_task)
    save("timeline", tl)
    return new_task

@app.patch("/api/timeline/weeks/{week_id}/days/{day_id}/tasks/{task_id}")
def update_task(week_id: str, day_id: str, task_id: str, body: TimelineTaskUpdate):
    tl = load("timeline")
    w = next((w for w in tl if w["id"] == week_id), None)
    if not w: raise HTTPException(404)
    d = next((d for d in w["days"] if d["id"] == day_id), None)
    if not d: raise HTTPException(404)
    t = next((t for t in d["tasks"] if t["id"] == task_id), None)
    if not t: raise HTTPException(404)
    if body.text is not None: t["text"] = body.text
    if body.done is not None: t["done"] = body.done
    save("timeline", tl)
    return t

@app.delete("/api/timeline/weeks/{week_id}/days/{day_id}/tasks/{task_id}")
def delete_task(week_id: str, day_id: str, task_id: str):
    tl = load("timeline")
    w = next((w for w in tl if w["id"] == week_id), None)
    if not w: raise HTTPException(404)
    d = next((d for d in w["days"] if d["id"] == day_id), None)
    if not d: raise HTTPException(404)
    d["tasks"] = [t for t in d["tasks"] if t["id"] != task_id]
    save("timeline", tl)
    return {"ok": True}

# ══════════════════════════════════════════════════════════════════════════════
# DAILY CHECKS
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/daily-checks")
def get_daily_checks():
    return load("daily_checks")

@app.post("/api/daily-checks")
def create_daily_check(body: DailyCheckCreate):
    checks = load("daily_checks")
    new = {**body.dict(), "id": new_id(), "createdAt": datetime.now().isoformat()}
    checks.insert(0, new)
    save("daily_checks", checks)
    return new

@app.delete("/api/daily-checks/{check_id}")
def delete_daily_check(check_id: str):
    checks = load("daily_checks")
    checks = [c for c in checks if c["id"] != check_id]
    save("daily_checks", checks)
    return {"ok": True}

# ══════════════════════════════════════════════════════════════════════════════
# AUTOMATION TASKS
# ══════════════════════════════════════════════════════════════════════════════
@app.get("/api/auto-tasks")
def get_auto_tasks():
    return load("auto_tasks")

@app.post("/api/auto-tasks")
def create_auto_task(body: AutoTaskCreate):
    tasks = load("auto_tasks")
    new = {**body.dict(), "id": new_id()}
    tasks.append(new)
    save("auto_tasks", tasks)
    return new

@app.patch("/api/auto-tasks/{task_id}")
def update_auto_task(task_id: str, body: AutoTaskUpdate):
    tasks = load("auto_tasks")
    t = next((t for t in tasks if t["id"] == task_id), None)
    if not t: raise HTTPException(404)
    for k, v in body.dict(exclude_none=True).items():
        t[k] = v
    save("auto_tasks", tasks)
    return t

@app.delete("/api/auto-tasks/{task_id}")
def delete_auto_task(task_id: str):
    tasks = load("auto_tasks")
    tasks = [t for t in tasks if t["id"] != task_id]
    save("auto_tasks", tasks)
    return {"ok": True}

# ── health ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health(): return {"status": "ok", "time": datetime.now().isoformat()}

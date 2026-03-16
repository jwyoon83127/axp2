import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil, Check, X,
         ListTodo, Calendar, ClipboardList, Copy } from 'lucide-react'
import * as api from '../api'

const TASK_STATUS = {
  pending:     { label: '대기',   cls: 'bg-gray-100 text-gray-500'     },
  in_progress: { label: '진행중', cls: 'bg-blue-100 text-blue-700'     },
  completed:   { label: '완료',   cls: 'bg-green-100 text-green-700'   },
  skipped:     { label: '보류',   cls: 'bg-yellow-100 text-yellow-600' },
}
const diffClr = { 하:'bg-green-100 text-green-700', 중:'bg-yellow-100 text-yellow-700', 상:'bg-red-100 text-red-600' }
const WEEKDAY_NAMES = ['월','화','수','목','금','토','일']

// ── 주간 날짜 자동 생성 ───────────────────────────────────────────────────────
function WeekDateSetup({ week, onDaysAdded, onUpdateWeek, onClose }) {
  const [startInput, setStartInput] = useState('')      // "3/17" 형식
  const [includeDays, setIncludeDays] = useState([0,1,2,3,4]) // 0=월 ~ 6=일 인덱스
  const [generating, setGenerating]   = useState(false)
  const [preview, setPreview]         = useState([])

  // 미리보기 생성
  const buildPreview = (input, days) => {
    if (!input.includes('/')) { setPreview([]); return }
    const parts = input.split('/')
    const month = parseInt(parts[0]), day = parseInt(parts[1])
    if (isNaN(month) || isNaN(day)) { setPreview([]); return }
    const year = new Date().getFullYear()
    const monday = new Date(year, month - 1, day)
    const entries = days.map(offset => {
      const d = new Date(monday); d.setDate(monday.getDate() + offset)
      return { date: `${d.getMonth()+1}/${d.getDate()}`, day: WEEKDAY_NAMES[offset] }
    })
    setPreview(entries)
  }

  const handleStartChange = (v) => { setStartInput(v); buildPreview(v, includeDays) }
  const toggleDay = (idx) => {
    const next = includeDays.includes(idx) ? includeDays.filter(i=>i!==idx) : [...includeDays, idx].sort((a,b)=>a-b)
    setIncludeDays(next); buildPreview(startInput, next)
  }

  const handleGenerate = async () => {
    if (!preview.length) return
    setGenerating(true)
    try {
      const newDays = []
      for (const entry of preview) {
        const day = await api.addDay(week.id, entry)
        newDays.push(day)
      }
      // 주차 기간(range) 자동 업데이트
      if (preview.length >= 2) {
        const range = `${preview[0].date} ~ ${preview[preview.length-1].date}`
        await api.updateWeek(week.id, { range })
        onUpdateWeek(week.id, 'range', range)
      }
      onDaysAdded(week.id, newDays)
      onClose()
    } finally { setGenerating(false) }
  }

  return (
    <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-blue-500" />
          <span className="text-xs font-semibold text-blue-700">주간 날짜 자동 생성</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600" onClick={onClose}><X size={14}/></button>
      </div>

      {/* 시작일 입력 */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">시작일 (월요일) — 예: 3/17</label>
        <input
          className="input text-sm w-36"
          placeholder="M/D"
          value={startInput}
          onChange={e => handleStartChange(e.target.value)}
        />
      </div>

      {/* 요일 선택 */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">포함할 요일</label>
        <div className="flex gap-1.5">
          {WEEKDAY_NAMES.map((name, idx) => (
            <button
              key={idx}
              onClick={() => toggleDay(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                includeDays.includes(idx)
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-400 border border-gray-200 hover:border-blue-300'
              }`}
            >{name}</button>
          ))}
        </div>
      </div>

      {/* 미리보기 */}
      {preview.length > 0 && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">생성될 날짜 미리보기</label>
          <div className="flex flex-wrap gap-1.5">
            {preview.map((p, i) => (
              <span key={i} className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded-lg font-medium">
                {p.date} ({p.day})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button className="btn-ghost text-xs" onClick={onClose}>취소</button>
        <button
          className="btn-primary text-xs py-1.5"
          disabled={!preview.length || generating}
          onClick={handleGenerate}
        >
          <Calendar size={12}/>{generating ? '생성 중...' : `${preview.length}일 생성`}
        </button>
      </div>
    </div>
  )
}

// ── 일간 업무 일괄 등록 ───────────────────────────────────────────────────────
function DailyBulkTaskAdd({ week, onBulkAdded, onClose }) {
  const [taskText, setTaskText]       = useState('')
  const [selectedDays, setSelectedDays] = useState(week.days.map(d => d.id))
  const [adding, setAdding]           = useState(false)

  const toggleDay = (id) =>
    setSelectedDays(p => p.includes(id) ? p.filter(i=>i!==id) : [...p, id])

  const selectAll   = () => setSelectedDays(week.days.map(d => d.id))
  const deselectAll = () => setSelectedDays([])

  const handleAdd = async () => {
    if (!taskText.trim() || !selectedDays.length) return
    setAdding(true)
    try {
      const results = []
      for (const dayId of selectedDays) {
        const task = await api.addTimelineTask(week.id, dayId, { text: taskText.trim() })
        results.push({ dayId, task })
      }
      onBulkAdded(week.id, results)
      setTaskText('')
    } finally { setAdding(false) }
  }

  return (
    <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-purple-500" />
          <span className="text-xs font-semibold text-purple-700">일간 업무 일괄 등록</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600" onClick={onClose}><X size={14}/></button>
      </div>

      {/* 업무명 입력 */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">업무 내용</label>
        <input
          className="input text-sm"
          placeholder="모든 선택 날짜에 추가될 업무 내용"
          value={taskText}
          onChange={e => setTaskText(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter') handleAdd() }}
          autoFocus
        />
      </div>

      {/* 날짜 선택 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">등록할 날짜 선택</label>
          <div className="flex gap-2">
            <button className="text-xs text-blue-500 hover:underline" onClick={selectAll}>전체 선택</button>
            <button className="text-xs text-gray-400 hover:underline" onClick={deselectAll}>전체 해제</button>
          </div>
        </div>
        {week.days.length === 0 ? (
          <p className="text-xs text-gray-400">날짜를 먼저 추가해주세요.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {week.days.map(d => (
              <button
                key={d.id}
                onClick={() => toggleDay(d.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedDays.includes(d.id)
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-400 border border-gray-200 hover:border-purple-300'
                }`}
              >{d.date} ({d.day})</button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button className="btn-ghost text-xs" onClick={onClose}>취소</button>
        <button
          className="btn-primary text-xs py-1.5"
          style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
          disabled={!taskText.trim() || !selectedDays.length || adding}
          onClick={handleAdd}
        >
          <Plus size={12}/>{adding ? '등록 중...' : `${selectedDays.length}일에 등록`}
        </button>
      </div>
    </div>
  )
}

// ── 주차 추가 폼 ──────────────────────────────────────────────────────────────
function WeekForm({ onSave, onCancel }) {
  const [f, setF] = useState({ label: '', range: '', theme: '', color: '#2E75B6' })
  return (
    <div className="card p-4 border-dashed border-2 border-blue-200 bg-blue-50/30 space-y-3">
      <p className="text-sm font-semibold text-blue-700">새 주차 추가</p>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-gray-500 mb-1 block">주차명</label><input className="input text-sm" placeholder="예: 4주차" value={f.label} onChange={e=>setF(p=>({...p,label:e.target.value}))} /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">기간</label><input className="input text-sm" placeholder="예: 3/30 ~ 4/3" value={f.range} onChange={e=>setF(p=>({...p,range:e.target.value}))} /></div>
        <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">테마</label><input className="input text-sm" placeholder="예: 성과 정착 & 내재화" value={f.theme} onChange={e=>setF(p=>({...p,theme:e.target.value}))} /></div>
        <div><label className="text-xs text-gray-500 mb-1 block">색상</label><input type="color" className="h-9 w-full rounded-lg border border-gray-200 cursor-pointer" value={f.color} onChange={e=>setF(p=>({...p,color:e.target.value}))} /></div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-ghost text-xs" onClick={onCancel}>취소</button>
        <button className="btn-primary text-xs py-1.5" disabled={!f.label||!f.theme} onClick={()=>onSave(f)}><Check size={13}/>저장</button>
      </div>
    </div>
  )
}

// ── 날짜 추가 폼 ──────────────────────────────────────────────────────────────
function DayForm({ onSave, onCancel }) {
  const [f, setF] = useState({ date:'', day:'월' })
  return (
    <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <input className="input text-xs py-1.5 w-24" placeholder="날짜 (3/14)" value={f.date} onChange={e=>setF(p=>({...p,date:e.target.value}))} />
      <select className="input text-xs py-1.5 w-16" value={f.day} onChange={e=>setF(p=>({...p,day:e.target.value}))}>
        {WEEKDAY_NAMES.map(d=><option key={d}>{d}</option>)}
      </select>
      <button className="btn-primary text-xs py-1 px-2" disabled={!f.date} onClick={()=>onSave(f)}><Check size={12}/></button>
      <button className="btn-ghost text-xs py-1 px-2" onClick={onCancel}><X size={12}/></button>
    </div>
  )
}

// ── 타임라인 업무 항목 ────────────────────────────────────────────────────────
function TaskItem({ task, weekId, dayId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [text,    setText]    = useState(task.text)

  const save = async () => { await onUpdate(weekId, dayId, task.id, { text }); setEditing(false) }
  const toggleDone = () => onUpdate(weekId, dayId, task.id, { done: !task.done })

  return (
    <li className="flex items-start gap-2 group py-0.5">
      <button onClick={toggleDone}
        className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-500'}`}>
        {task.done && <Check size={10} className="text-white" />}
      </button>
      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input className="input text-xs py-0.5 flex-1" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')save()}} autoFocus />
          <button className="text-green-500 hover:text-green-700" onClick={save}><Check size={13}/></button>
          <button className="text-gray-400 hover:text-gray-600" onClick={()=>{setEditing(false);setText(task.text)}}><X size={13}/></button>
        </div>
      ) : (
        <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-600'}`}>{task.text}</span>
      )}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!editing && <button className="text-gray-400 hover:text-blue-500" onClick={()=>setEditing(true)}><Pencil size={12}/></button>}
        <button className="text-gray-300 hover:text-red-500" onClick={()=>onDelete(weekId, dayId, task.id)}><Trash2 size={12}/></button>
      </div>
    </li>
  )
}

// ── 주차 배정 업무 섹션 ────────────────────────────────────────────────────────
function WeekTaskSection({ week, tasks, onTasksChange }) {
  const weekTasks  = tasks.filter(t => t.weekId === week.id)
  const unassigned = tasks.filter(t => !t.weekId)
  const [selectedId, setSelectedId] = useState('')
  const [assigning,  setAssigning]  = useState(false)
  const [search,     setSearch]     = useState('')

  const filtered = unassigned.filter(t =>
    !search || t.name?.includes(search) || t.team?.includes(search)
  )

  const handleAssign = async () => {
    if (!selectedId) return
    setAssigning(true)
    try {
      await api.updateAutoTask(selectedId, { weekId: week.id })
      onTasksChange(p => p.map(t => t.id === selectedId ? { ...t, weekId: week.id } : t))
      setSelectedId('')
    } finally { setAssigning(false) }
  }

  const handleUnassign = async (id) => {
    await api.updateAutoTask(id, { weekId: '' })
    onTasksChange(p => p.map(t => t.id === id ? { ...t, weekId: '' } : t))
  }

  const done  = weekTasks.filter(t => t.status === 'completed').length
  const total = weekTasks.length

  return (
    <div className="mt-5 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo size={14} className="text-purple-500" />
          <span className="text-xs font-semibold text-gray-600">주차 배정 업무</span>
          <span className="bg-purple-50 text-purple-500 text-xs px-1.5 py-0.5 rounded-full font-medium">{total}건</span>
          {total > 0 && <span className="text-xs text-green-600">{done}건 완료 ({Math.round((done/total)*100)}%)</span>}
        </div>
        <span className="text-xs text-gray-400">미배정 {unassigned.length}건</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <input className="input text-xs py-1.5 w-28 flex-shrink-0" placeholder="팀·업무 검색"
          value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="input text-xs py-1.5 flex-1 min-w-0" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
          <option value="">-- 배정할 업무 선택 ({filtered.length}건) --</option>
          {filtered.map(t=><option key={t.id} value={t.id}>[{t.team}] {t.name}</option>)}
        </select>
        <button className="btn-primary text-xs py-1.5 px-3 flex-shrink-0 flex items-center gap-1"
          disabled={!selectedId||assigning} onClick={handleAssign}>
          <Plus size={12}/>{assigning?'...':'배정'}
        </button>
      </div>
      {total === 0 ? (
        <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
          배정된 업무가 없습니다.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {weekTasks.map(t => {
            const st = TASK_STATUS[t.status] ?? TASK_STATUS.pending
            return (
              <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100 group hover:border-purple-200 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-medium ${t.status==='completed'?'line-through text-gray-400':'text-gray-700'}`}>{t.name}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{t.team}</span>
                    <span className="text-xs text-gray-400">{t.type}</span>
                  </div>
                  {(t.frequency||t.time) && (
                    <div className="text-xs text-gray-400 mt-0.5">{t.frequency}{t.time&&` · ${t.time}`}</div>
                  )}
                </div>
                <span className={`badge flex-shrink-0 text-xs ${diffClr[t.difficulty]??diffClr['하']}`}>{t.difficulty}</span>
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium flex-shrink-0 ${st.cls}`}>{st.label}</span>
                <button className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-orange-500 transition-all flex-shrink-0"
                  onClick={()=>handleUnassign(t.id)} title="배정 해제"><X size={13}/></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function TabTimeline({ timeline, onTimelineChange, tasks, onTasksChange }) {
  const [expanded,      setExpanded]      = useState(timeline[0]?.id ?? null)
  const [showWeekForm,  setShowWeekForm]  = useState(false)
  const [addingDay,     setAddingDay]     = useState(null)
  const [addingTask,    setAddingTask]    = useState(null)
  const [newTaskText,   setNewTaskText]   = useState('')
  // 주간 설정 패널 상태
  const [showDateSetup, setShowDateSetup] = useState(null)  // weekId or null
  const [showBulkAdd,   setShowBulkAdd]   = useState(null)  // weekId or null

  // ── helpers ───────────────────────────────────────────────────────────────
  const mutate = (fn) => onTimelineChange(prev => fn(JSON.parse(JSON.stringify(prev))))

  const handleAddWeek = async (body) => {
    const week = await api.addWeek(body)
    mutate(tl => { tl.push(week); return tl })
    setShowWeekForm(false)
    setExpanded(week.id)
  }

  const handleDeleteWeek = async (wid) => {
    if (!confirm('이 주차를 삭제할까요?')) return
    await api.deleteWeek(wid)
    mutate(tl => tl.filter(w => w.id !== wid))
  }

  const handleEditWeek = async (wid, field, value) => {
    await api.updateWeek(wid, { [field]: value })
    mutate(tl => { const w = tl.find(w=>w.id===wid); if(w) w[field]=value; return tl })
  }

  const handleAddDay = async (wid, body) => {
    const day = await api.addDay(wid, body)
    mutate(tl => { const w = tl.find(w=>w.id===wid); if(w) w.days.push(day); return tl })
    setAddingDay(null)
  }

  // 날짜 자동 생성 콜백 (여러 날짜 한꺼번에)
  const handleDaysAdded = (wid, newDays) => {
    mutate(tl => {
      const w = tl.find(w=>w.id===wid)
      if(w) w.days.push(...newDays)
      return tl
    })
  }

  const handleDeleteDay = async (wid, did) => {
    if (!confirm('이 날짜를 삭제할까요?')) return
    await api.deleteDay(wid, did)
    mutate(tl => { const w = tl.find(w=>w.id===wid); if(w) w.days=w.days.filter(d=>d.id!==did); return tl })
  }

  const handleAddTask = async (wid, did) => {
    if (!newTaskText.trim()) return
    const task = await api.addTimelineTask(wid, did, { text: newTaskText.trim() })
    mutate(tl => { const d = tl.find(w=>w.id===wid)?.days?.find(d=>d.id===did); if(d) d.tasks.push(task); return tl })
    setNewTaskText(''); setAddingTask(null)
  }

  const handleUpdateTask = async (wid, did, tid, body) => {
    await api.updateTimelineTask(wid, did, tid, body)
    mutate(tl => {
      const d = tl.find(w=>w.id===wid)?.days?.find(d=>d.id===did)
      if(d) { const t = d.tasks.find(t=>t.id===tid); if(t) Object.assign(t, body) }
      return tl
    })
  }

  const handleDeleteTask = async (wid, did, tid) => {
    await api.deleteTimelineTask(wid, did, tid)
    mutate(tl => {
      const d = tl.find(w=>w.id===wid)?.days?.find(d=>d.id===did)
      if(d) d.tasks = d.tasks.filter(t=>t.id!==tid)
      return tl
    })
  }

  // 일간 업무 일괄 등록 콜백
  const handleBulkAdded = (wid, results) => {
    mutate(tl => {
      const w = tl.find(w=>w.id===wid)
      if(w) {
        results.forEach(({ dayId, task }) => {
          const d = w.days.find(d=>d.id===dayId)
          if(d) d.tasks.push(task)
        })
      }
      return tl
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">주차·날짜·업무를 자유롭게 추가·수정·삭제할 수 있습니다.</p>
        <button className="btn-primary" onClick={() => setShowWeekForm(v=>!v)}><Plus size={14}/>주차 추가</button>
      </div>

      {showWeekForm && <WeekForm onSave={handleAddWeek} onCancel={()=>setShowWeekForm(false)} />}

      {timeline.map(week => {
        const allTasks      = week.days.flatMap(d => d.tasks)
        const doneCount     = allTasks.filter(t => t.done).length
        const assignedCount = tasks ? tasks.filter(t => t.weekId === week.id).length : 0
        const open = expanded === week.id

        return (
          <div key={week.id} className="card overflow-hidden">
            {/* ── 주차 헤더 ── */}
            <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
              <button className="flex-1 flex items-center gap-3 text-left" onClick={() => setExpanded(open ? null : week.id)}>
                <span className="text-white text-sm font-bold px-3 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: week.color }}>{week.label}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{week.theme}</p>
                  <p className="text-gray-400 text-xs">{week.range}</p>
                </div>
                <div className="flex items-center gap-3 ml-auto mr-2 flex-shrink-0">
                  {assignedCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-purple-500">
                      <ListTodo size={11}/>{assignedCount}건 배정
                    </span>
                  )}
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: allTasks.length ? `${(doneCount/allTasks.length)*100}%` : '0%', backgroundColor: week.color }} />
                  </div>
                  <span className="text-xs text-gray-400">{doneCount}/{allTasks.length}</span>
                </div>
                {open ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0"/> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0"/>}
              </button>
              <input type="color" className="w-6 h-6 rounded border border-gray-200 cursor-pointer flex-shrink-0"
                value={week.color} onChange={e=>handleEditWeek(week.id,'color',e.target.value)} title="색상 변경" />
              <button className="btn-danger" onClick={() => handleDeleteWeek(week.id)}><Trash2 size={13}/>주차 삭제</button>
            </div>

            {open && (
              <div className="border-t border-gray-100 px-5 pb-5">

                {/* ── 주차 정보 인라인 편집 ── */}
                <div className="grid grid-cols-3 gap-2 mt-3 mb-3 p-3 bg-gray-50 rounded-lg">
                  {[['label','주차명'],['range','기간'],['theme','테마']].map(([k,l]) => (
                    <div key={k}>
                      <label className="text-xs text-gray-400 mb-1 block">{l}</label>
                      <input className="input text-xs py-1.5" value={week[k]}
                        onChange={e => handleEditWeek(week.id, k, e.target.value)} />
                    </div>
                  ))}
                </div>

                {/* ── 빠른 설정 버튼 ── */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-400 mr-1">빠른 설정:</span>
                  <button
                    onClick={() => { setShowDateSetup(showDateSetup === week.id ? null : week.id); setShowBulkAdd(null) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      showDateSetup === week.id
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <Calendar size={12}/>날짜 자동 생성
                  </button>
                  <button
                    onClick={() => { setShowBulkAdd(showBulkAdd === week.id ? null : week.id); setShowDateSetup(null) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      showBulkAdd === week.id
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
                    }`}
                    disabled={week.days.length === 0}
                    title={week.days.length === 0 ? '날짜를 먼저 추가하세요' : ''}
                  >
                    <ClipboardList size={12}/>일간 업무 일괄 등록
                  </button>
                </div>

                {/* ── 날짜 자동 생성 패널 ── */}
                {showDateSetup === week.id && (
                  <div className="mb-4">
                    <WeekDateSetup
                      week={week}
                      onDaysAdded={handleDaysAdded}
                      onUpdateWeek={handleEditWeek}
                      onClose={() => setShowDateSetup(null)}
                    />
                  </div>
                )}

                {/* ── 일간 업무 일괄 등록 패널 ── */}
                {showBulkAdd === week.id && (
                  <div className="mb-4">
                    <DailyBulkTaskAdd
                      week={week}
                      onBulkAdded={handleBulkAdded}
                      onClose={() => setShowBulkAdd(null)}
                    />
                  </div>
                )}

                {/* ── 날짜별 타임라인 ── */}
                <div className="space-y-0">
                  {week.days.map((d, di) => (
                    <div key={d.id} className="flex gap-4">
                      <div className="flex-shrink-0 w-16 pt-1">
                        <p className="text-sm font-bold text-gray-700">{d.date}</p>
                        <p className="text-xs text-gray-400">{d.day}요일</p>
                      </div>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full border-2 mt-1.5" style={{ borderColor: week.color }} />
                        {di < week.days.length-1 && <div className="w-0.5 flex-1 my-1" style={{ backgroundColor: week.color+'30' }} />}
                      </div>
                      <div className="flex-1 pb-4 pt-0.5 group/day">
                        <ul className="space-y-1">
                          {d.tasks.map(t => (
                            <TaskItem key={t.id} task={t} weekId={week.id} dayId={d.id}
                              onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
                          ))}
                        </ul>
                        {addingTask === `${week.id}-${d.id}` ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input className="input text-xs py-1 flex-1" placeholder="업무 내용 입력 후 Enter"
                              value={newTaskText} onChange={e=>setNewTaskText(e.target.value)}
                              onKeyDown={e=>{if(e.key==='Enter')handleAddTask(week.id,d.id); if(e.key==='Escape'){setAddingTask(null);setNewTaskText('')}}}
                              autoFocus />
                            <button className="btn-primary text-xs py-1 px-2" onClick={()=>handleAddTask(week.id,d.id)}><Check size={12}/></button>
                            <button className="btn-ghost text-xs py-1 px-2" onClick={()=>{setAddingTask(null);setNewTaskText('')}}><X size={12}/></button>
                          </div>
                        ) : (
                          <button className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 opacity-0 group-hover/day:opacity-100 transition-all"
                            onClick={()=>{setAddingTask(`${week.id}-${d.id}`);setNewTaskText('')}}>
                            <Plus size={12}/>업무 추가
                          </button>
                        )}
                        <button className="mt-1 flex items-center gap-1 text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover/day:opacity-100 transition-all"
                          onClick={()=>handleDeleteDay(week.id, d.id)}>
                          <Trash2 size={11}/>날짜 삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 날짜 직접 추가 */}
                {addingDay === week.id ? (
                  <DayForm onSave={body=>handleAddDay(week.id, body)} onCancel={()=>setAddingDay(null)} />
                ) : (
                  <button className="mt-3 flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={()=>setAddingDay(week.id)}>
                    <Plus size={15}/>날짜 직접 추가
                  </button>
                )}

                {/* ── 주차 배정 업무 ── */}
                {tasks && onTasksChange && (
                  <WeekTaskSection week={week} tasks={tasks} onTasksChange={onTasksChange} />
                )}
              </div>
            )}
          </div>
        )
      })}

      {timeline.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">아직 주차가 없습니다. 위 버튼으로 추가하세요.</p>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertCircle, Search, Plus, Trash2, Check, ListTodo } from 'lucide-react'
import { updateTeam, createAutoTask, deleteAutoTask, updateAutoTask } from '../api'

const STATUS_MAP = {
  not_started: { label: '미착수', cls: 'bg-gray-100 text-gray-500'   },
  in_progress:  { label: '진행중', cls: 'bg-blue-100 text-blue-700'   },
  completed:    { label: '완료',   cls: 'bg-green-100 text-green-700' },
}
const TASK_STATUS = {
  pending:     { label: '대기',   cls: 'bg-gray-100 text-gray-500'    },
  in_progress: { label: '진행중', cls: 'bg-blue-100 text-blue-700'    },
  completed:   { label: '완료',   cls: 'bg-green-100 text-green-700'  },
  skipped:     { label: '보류',   cls: 'bg-yellow-100 text-yellow-600'},
}
const TYPES = ['업무 자동화','모니터링/알림','문서 작성/편집','데이터 분석/리포팅','운영 관리','개발 작업','정산/결제 처리','데이터 수집/추출','고객 응대/VOC','장애 대응','HR/채용 관리','디자인/이미지 작업','기타']
const DIFFS = ['하','중','상']
const BLANK = { name:'', type:'업무 자동화', difficulty:'하', frequency:'', time:'', aiTools:'' }
const diffClr = { 하:'bg-green-100 text-green-700', 중:'bg-yellow-100 text-yellow-700', 상:'bg-red-100 text-red-600' }

// ── 팀 업무 목록 서브 컴포넌트 ────────────────────────────────────────────────
function TeamTaskSection({ team, tasks, onTasksChange }) {
  const teamTasks = tasks.filter(t => t.team === team.name)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ ...BLANK })
  const [saving, setSaving]     = useState(false)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const created = await createAutoTask({ ...form, team: team.name, member: '' })
      onTasksChange(p => [...p, created])
      setForm({ ...BLANK })
      setShowForm(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('이 업무를 삭제할까요?')) return
    await deleteAutoTask(id)
    onTasksChange(p => p.filter(t => t.id !== id))
  }

  const handleStatusChange = async (id, status) => {
    await updateAutoTask(id, { status })
    onTasksChange(p => p.map(t => t.id === id ? { ...t, status } : t))
  }

  const done  = teamTasks.filter(t => t.status === 'completed').length
  const total = teamTasks.length

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo size={14} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-600">팀 업무 목록</span>
          <span className="bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">{total}건</span>
          {total > 0 && <span className="text-xs text-green-600">{done}건 완료 ({total > 0 ? Math.round((done/total)*100) : 0}%)</span>}
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
          <Plus size={13}/> 업무 추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="mb-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <input className="input text-xs py-1.5" placeholder="업무명 *"
                value={form.name} onChange={e => upd('name', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} autoFocus />
            </div>
            <select className="input text-xs py-1.5" value={form.type} onChange={e => upd('type', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="input text-xs py-1.5" value={form.difficulty} onChange={e => upd('difficulty', e.target.value)}>
              {DIFFS.map(d => <option key={d}>{d}</option>)}
            </select>
            <input className="input text-xs py-1.5" placeholder="실행 빈도 (매일, 주 1회...)"
              value={form.frequency} onChange={e => upd('frequency', e.target.value)} />
            <input className="input text-xs py-1.5" placeholder="소요 시간 (30분, 1시간...)"
              value={form.time} onChange={e => upd('time', e.target.value)} />
            <div className="col-span-2">
              <input className="input text-xs py-1.5" placeholder="추천 AI 툴 (n8n, Claude Cowork...)"
                value={form.aiTools} onChange={e => upd('aiTools', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-ghost text-xs py-1"
              onClick={() => { setShowForm(false); setForm({ ...BLANK }) }}>취소</button>
            <button className="btn-primary text-xs py-1"
              disabled={!form.name.trim() || saving} onClick={handleAdd}>
              <Check size={12}/>{saving ? '저장 중...' : '추가'}
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {total === 0 && !showForm ? (
        <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
          등록된 업무가 없습니다. 위 버튼으로 추가하세요.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {teamTasks.map(t => {
            const st = TASK_STATUS[t.status] ?? TASK_STATUS.pending
            return (
              <div key={t.id}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100 group hover:border-gray-200 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {t.name}
                    </span>
                    <span className="text-xs text-gray-400">{t.type}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                    {t.frequency && <span>{t.frequency}</span>}
                    {t.time      && <span>· {t.time}</span>}
                    {t.aiTools   && <span className="text-blue-400">🤖 {t.aiTools}</span>}
                  </div>
                </div>
                <span className={`badge flex-shrink-0 text-xs ${diffClr[t.difficulty] ?? diffClr['하']}`}>{t.difficulty}</span>
                {/* 상태 드롭다운 */}
                <select
                  className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer flex-shrink-0 ${st.cls}`}
                  value={t.status}
                  onChange={e => handleStatusChange(t.id, e.target.value)}>
                  {Object.entries(TASK_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                  onClick={() => handleDelete(t.id)}>
                  <Trash2 size={13}/>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function TabTeams({ teams, onTeamsChange, tasks, onTasksChange }) {
  const [expanded, setExpanded] = useState(null)
  const [search,   setSearch]   = useState('')
  const [saving,   setSaving]   = useState(null)

  const filtered = teams.filter(t =>
    t.name.includes(search) || t.members?.some(m => m.includes(search))
  )

  const patch = async (id, field, value) => {
    setSaving(id)
    try {
      await updateTeam(id, { [field]: value })
      onTeamsChange(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
    } finally { setSaving(null) }
  }

  const totalCompleted = teams.reduce((s, t) => s + (t.completed || 0), 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="팀·이름 검색"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto flex gap-3 text-xs text-gray-400">
          <span>진행중 <b className="text-blue-600">{teams.filter(t=>t.status==='in_progress').length}</b>팀</span>
          <span>완료 <b className="text-green-600">{teams.filter(t=>t.status==='completed').length}</b>팀</span>
          <span>총 <b className="text-gray-700">{totalCompleted}</b>건 완료</span>
        </div>
      </div>

      {filtered.map(team => {
        const pct  = team.totalTasks > 0 ? Math.round(((team.completed||0) / team.totalTasks) * 100) : 0
        const st   = STATUS_MAP[team.status] ?? STATUS_MAP.not_started
        const open = expanded === team.id
        const teamTaskCount = tasks.filter(t => t.team === team.name).length

        return (
          <div key={team.id} className="card overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setExpanded(open ? null : team.id)}>
              <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{team.name}</span>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                  {team.issues && <span className="flex items-center gap-1 text-red-500 text-xs"><AlertCircle size={12}/>이슈</span>}
                  {saving === team.id && <span className="text-xs text-gray-400 animate-pulse">저장 중...</span>}
                  {teamTaskCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 ml-1">
                      <ListTodo size={11}/>{teamTaskCount}건 등록
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-gray-400 text-xs">{team.members?.length ?? 0}명</span>
                  <span className="text-gray-400 text-xs">총 {team.totalTasks}건</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-xs">
                    <div className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: team.color }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{team.completed||0}건 ({pct}%)</span>
                </div>
              </div>
              {open ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
            </button>

            {open && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                {/* 기본 정보 3열 */}
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">팀원</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(team.members ?? []).map(m => (
                        <span key={m} className="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">주요 자동화 유형</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(team.types ?? []).map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                          style={{ backgroundColor: team.color }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">진행 현황 업데이트</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-14">상태</span>
                        <select className="input flex-1 py-1.5 text-xs"
                          value={team.status}
                          onChange={e => patch(team.id, 'status', e.target.value)}>
                          <option value="not_started">미착수</option>
                          <option value="in_progress">진행중</option>
                          <option value="completed">완료</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-14">완료 건수</span>
                        <input type="number" min="0" max={team.totalTasks}
                          className="input w-20 py-1.5 text-xs text-center"
                          value={team.completed || 0}
                          onChange={e => patch(team.id, 'completed', Math.max(0, Math.min(Number(e.target.value), team.totalTasks)))} />
                        <span className="text-xs text-gray-400">/ {team.totalTasks}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-14">이슈 여부</span>
                        <button onClick={() => patch(team.id, 'issues', !team.issues)}
                          className={`text-xs px-3 py-1 rounded-full transition-colors ${team.issues ? 'bg-red-100 text-red-600 font-semibold' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                          {team.issues ? '이슈 있음' : '정상'}
                        </button>
                      </div>
                      <input className="input text-xs py-1.5" placeholder="메모..."
                        value={team.memo || ''}
                        onChange={e => patch(team.id, 'memo', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ── 팀 업무 목록 (등록/삭제) ── */}
                <TeamTaskSection team={team} tasks={tasks} onTasksChange={onTasksChange} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { useState } from 'react'
import { Plus, X, Check, Trash2, Search, Filter, ListTodo } from 'lucide-react'
import { createAutoTask, updateAutoTask, deleteAutoTask } from '../api'

const TYPES     = ['업무 자동화','모니터링/알림','문서 작성/편집','데이터 분석/리포팅','운영 관리','개발 작업','정산/결제 처리','데이터 수집/추출','고객 응대/VOC','장애 대응','HR/채용 관리','디자인/이미지 작업','기타']
const DIFFS     = ['하','중','상']
const STATUS_MAP = { pending: { label: '대기', cls: 'bg-gray-100 text-gray-500' }, in_progress: { label: '진행중', cls: 'bg-blue-100 text-blue-700' }, completed: { label: '완료', cls: 'bg-green-100 text-green-700' }, skipped: { label: '보류', cls: 'bg-yellow-100 text-yellow-600' } }
const BLANK_TASK = { team:'', member:'', name:'', description:'', frequency:'', time:'', programs:'', type:'업무 자동화', difficulty:'하', aiTools:'' }

export default function TabTasks({ teams, tasks, onTasksChange }) {
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(BLANK_TASK)
  const [search,    setSearch]    = useState('')
  const [filterTeam,setFilterTeam]= useState('전체')
  const [filterType,setFilterType]= useState('전체')
  const [filterDiff,setFilterDiff]= useState('전체')
  const [loading,   setLoading]   = useState(false)

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.team || !form.name) return
    setLoading(true)
    try {
      const created = await createAutoTask(form)
      onTasksChange(p => [...p, created])
      setForm({ ...BLANK_TASK })
      setShowForm(false)
    } finally { setLoading(false) }
  }

  const patchStatus = async (id, status) => {
    await updateAutoTask(id, { status })
    onTasksChange(p => p.map(t => t.id === id ? { ...t, status } : t))
  }

  const remove = async (id) => {
    if (!confirm('이 업무를 삭제할까요?')) return
    await deleteAutoTask(id)
    onTasksChange(p => p.filter(t => t.id !== id))
  }

  const filtered = tasks.filter(t =>
    (filterTeam === '전체' || t.team === filterTeam) &&
    (filterType === '전체' || t.type === filterType) &&
    (filterDiff === '전체' || t.difficulty === filterDiff) &&
    (!search || t.name.includes(search) || t.member?.includes(search) || t.team.includes(search))
  )

  const diffClr = { 하: 'bg-green-100 text-green-700', 중: 'bg-yellow-100 text-yellow-700', 상: 'bg-red-100 text-red-600' }

  return (
    <div className="space-y-4">
      {/* 통계 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '전체 업무',   value: `${tasks.length}건`,                               cls: 'border-blue-200 text-blue-700 bg-blue-50' },
          { label: '진행중',      value: `${tasks.filter(t=>t.status==='in_progress').length}건`, cls: 'border-yellow-200 text-yellow-700 bg-yellow-50' },
          { label: '완료',        value: `${tasks.filter(t=>t.status==='completed').length}건`,   cls: 'border-green-200 text-green-700 bg-green-50' },
          { label: '대기중',      value: `${tasks.filter(t=>t.status==='pending').length}건`,      cls: 'border-gray-200 text-gray-600 bg-gray-50' },
        ].map((s,i) => (
          <div key={i} className={`rounded-xl p-3 border flex flex-col gap-0.5 ${s.cls}`}>
            <span className="text-xs opacity-70">{s.label}</span>
            <span className="text-xl font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* 필터 툴바 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 py-2 text-sm w-48" placeholder="업무명·팀·담당자" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="input py-2 text-sm" value={filterTeam} onChange={e=>setFilterTeam(e.target.value)}>
          <option>전체</option>
          {teams.map(t=><option key={t.id}>{t.name}</option>)}
        </select>
        <select className="input py-2 text-sm" value={filterType} onChange={e=>setFilterType(e.target.value)}>
          <option>전체</option>
          {TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select className="input py-2 text-sm w-24" value={filterDiff} onChange={e=>setFilterDiff(e.target.value)}>
          <option>전체</option>
          {DIFFS.map(d=><option key={d}>{d}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-1">{filtered.length}건</span>
        <button className="btn-primary ml-auto" onClick={() => setShowForm(v=>!v)}><Plus size={14}/>업무 추가</button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="card p-5 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">업무 추가</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400 hover:text-gray-600"/></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">팀 <span className="text-red-400">*</span></label>
              <select className="input" value={form.team} onChange={e=>upd('team',e.target.value)}>
                <option value="">선택</option>
                {teams.map(t=><option key={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">담당자</label>
              <input className="input" placeholder="이름" value={form.member} onChange={e=>upd('member',e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">업무명 <span className="text-red-400">*</span></label>
              <input className="input" placeholder="자동화할 업무명" value={form.name} onChange={e=>upd('name',e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">업무 설명</label>
              <textarea rows={2} className="input resize-none" value={form.description} onChange={e=>upd('description',e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">실행 빈도</label>
                  <input className="input text-sm" placeholder="매일, 주 1회..." value={form.frequency} onChange={e=>upd('frequency',e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">소요 시간</label>
                  <input className="input text-sm" placeholder="30분, 1시간..." value={form.time} onChange={e=>upd('time',e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">자동화 유형</label>
                  <select className="input text-sm" value={form.type} onChange={e=>upd('type',e.target.value)}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">난이도</label>
                  <select className="input text-sm" value={form.difficulty} onChange={e=>upd('difficulty',e.target.value)}>
                    {DIFFS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">추천 AI 툴</label>
            <input className="input" placeholder="n8n, Claude Cowork, Genspark..." value={form.aiTools} onChange={e=>upd('aiTools',e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowForm(false)}>취소</button>
            <button className="btn-primary" disabled={!form.team||!form.name||loading} onClick={submit}>
              <Check size={14}/>{loading?'저장 중...':'추가'}
            </button>
          </div>
        </div>
      )}

      {/* 업무 테이블 */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <ListTodo size={36} className="mx-auto mb-2 opacity-25" />
            <p className="text-sm">등록된 업무가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['팀','담당자','업무명','유형','빈도','소요시간','난이도','AI 툴','상태',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const st = STATUS_MAP[t.status] ?? STATUS_MAP.pending
                  return (
                    <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">{t.team}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{t.member||'—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate" title={t.name}>{t.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{t.type}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{t.frequency||'—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{t.time||'—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${diffClr[t.difficulty] ?? diffClr['하']}`}>{t.difficulty}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[130px] truncate">{t.aiTools||'—'}</td>
                      <td className="px-4 py-3">
                        <select className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${st.cls}`}
                          value={t.status}
                          onChange={e => patchStatus(t.id, e.target.value)}>
                          {Object.entries(STATUS_MAP).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-gray-300 hover:text-red-500 transition-colors" onClick={() => remove(t.id)}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

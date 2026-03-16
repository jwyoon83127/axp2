import { useState } from 'react'
import { Plus, X, Check, ClipboardList, Trash2 } from 'lucide-react'
import { createDailyCheck, deleteDailyCheck } from '../api'

const BLANK = { date: new Date().toISOString().slice(0,10), team: '', member: '', goal: '', done: '', issues: '', support: '', tomorrow: '', status: 'completed' }

export default function TabDaily({ teams, checks, onChecksChange }) {
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(BLANK)
  const [loading,  setLoading]  = useState(false)
  const [filterTeam, setFilterTeam] = useState('전체')
  const [filterDate, setFilterDate] = useState('')

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.team || !form.member) return
    setLoading(true)
    try {
      const created = await createDailyCheck(form)
      onChecksChange(p => [created, ...p])
      setForm({ ...BLANK })
      setShowForm(false)
    } finally { setLoading(false) }
  }

  const remove = async (id) => {
    await deleteDailyCheck(id)
    onChecksChange(p => p.filter(c => c.id !== id))
  }

  const filtered = checks.filter(c =>
    (filterTeam === '전체' || c.team === filterTeam) &&
    (!filterDate || c.date === filterDate)
  )

  const statusCls = { completed: 'bg-green-100 text-green-700', in_progress: 'bg-blue-100 text-blue-700', issue: 'bg-red-100 text-red-600' }
  const statusLbl = { completed: '완료', in_progress: '진행중', issue: '이슈있음' }

  return (
    <div className="space-y-4">
      {/* 통계 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '총 제출 건수', value: `${checks.length}건`,                                       cls: 'border-blue-200 text-blue-700 bg-blue-50' },
          { label: '제출 팀 수',   value: `${new Set(checks.map(c=>c.team)).size}팀`,                  cls: 'border-green-200 text-green-700 bg-green-50' },
          { label: '팀 제출율',    value: `${checks.length ? Math.round((new Set(checks.map(c=>c.team)).size/teams.length)*100) : 0}%`, cls: 'border-purple-200 text-purple-700 bg-purple-50' },
          { label: '이슈 건수',    value: `${checks.filter(c=>c.issues).length}건`,                   cls: 'border-red-200 text-red-600 bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-3 border flex flex-col gap-0.5 ${s.cls}`}>
            <span className="text-xs opacity-70">{s.label}</span>
            <span className="text-xl font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* 툴바 */}
      <div className="flex items-center gap-3 flex-wrap">
        <select className="input max-w-[140px] py-2" value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
          <option>전체</option>
          {teams.map(t => <option key={t.id}>{t.name}</option>)}
        </select>
        <input type="date" className="input max-w-[150px] py-2" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        {filterDate && <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setFilterDate('')}>✕ 초기화</button>}
        <button className="btn-primary ml-auto" onClick={() => setShowForm(v => !v)}>
          <Plus size={14} /> 체크 추가
        </button>
      </div>

      {/* 폼 */}
      {showForm && (
        <div className="card p-5 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">데일리 체크 작성</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">날짜 <span className="text-red-400">*</span></label>
              <input type="date" className="input" value={form.date} onChange={e => upd('date', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">팀 <span className="text-red-400">*</span></label>
              <select className="input" value={form.team} onChange={e => upd('team', e.target.value)}>
                <option value="">선택</option>
                {teams.map(t => <option key={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">담당자 <span className="text-red-400">*</span></label>
              <input className="input" placeholder="이름" value={form.member} onChange={e => upd('member', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[['goal','오늘의 자동화 목표'],['done','시도한 항목 & 결과'],['issues','이슈/장애 사항'],['support','AX팀 지원 요청']].map(([k,l]) => (
              <div key={k}>
                <label className="text-xs text-gray-500 mb-1 block">{l}</label>
                <textarea rows={2} className="input resize-none" placeholder={k==='issues'?'없으면 비워두세요':''}
                  value={form[k]} onChange={e => upd(k, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">내일 계획</label>
            <input className="input" value={form.tomorrow} onChange={e => upd('tomorrow', e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">상태:</span>
              {[['completed','완료','bg-green-500'],['in_progress','진행중','bg-blue-500'],['issue','이슈있음','bg-red-500']].map(([s,l,c]) => (
                <button key={s} onClick={() => upd('status', s)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${form.status===s ? `${c} text-white` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button className="btn-primary" disabled={!form.team || !form.member || loading} onClick={submit}>
              <Check size={14} /> {loading ? '저장 중...' : '제출'}
            </button>
          </div>
        </div>
      )}

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">제출 이력 ({filtered.length}건)</h3>
          {filtered.length > 0 && (
            <div className="flex gap-3 text-xs">
              <span className="text-green-600">{filtered.filter(c=>c.status==='completed').length} 완료</span>
              <span className="text-blue-600">{filtered.filter(c=>c.status==='in_progress').length} 진행중</span>
              <span className="text-red-600">{filtered.filter(c=>c.status==='issue').length} 이슈</span>
            </div>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            <ClipboardList size={36} className="mx-auto mb-2 opacity-25" />
            <p className="text-sm">아직 제출된 체크가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="bg-gray-50">
                  {['날짜','팀','담당자','목표','완료 항목','이슈','AX팀 요청','내일 계획','상태',''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/70">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.date}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700 whitespace-nowrap">{c.team}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.member}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[110px] truncate">{c.goal||'—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[110px] truncate">{c.done||'—'}</td>
                    <td className="px-4 py-3 text-xs max-w-[90px] truncate">{c.issues ? <span className="text-red-500">{c.issues}</span> : <span className="text-gray-300">없음</span>}</td>
                    <td className="px-4 py-3 text-xs max-w-[90px] truncate text-gray-500">{c.support||'—'}</td>
                    <td className="px-4 py-3 text-xs max-w-[90px] truncate text-gray-500">{c.tomorrow||'—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusCls[c.status] ?? statusCls.completed}`}>{statusLbl[c.status] ?? '완료'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-gray-300 hover:text-red-500 transition-colors" onClick={() => remove(c.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

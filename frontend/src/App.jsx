import { useState, useEffect } from 'react'
import { Home, Users, ClipboardList, Calendar, ListTodo, Clock, AlertCircle } from 'lucide-react'
import TabDashboard from './components/TabDashboard'
import TabTeams     from './components/TabTeams'
import TabDaily     from './components/TabDaily'
import TabTimeline  from './components/TabTimeline'
import TabTasks     from './components/TabTasks'
import * as api from './api'

const TABS = [
  { id: 'dashboard', label: '대시보드',    icon: Home         },
  { id: 'teams',     label: '팀 현황',     icon: Users        },
  { id: 'daily',     label: '데일리 체크', icon: ClipboardList },
  { id: 'timeline',  label: '타임라인',    icon: Calendar     },
  { id: 'tasks',     label: '업무 목록',   icon: ListTodo     },
]

export default function App() {
  const [tab,      setTab]      = useState('dashboard')
  const [teams,    setTeams]    = useState([])
  const [timeline, setTimeline] = useState([])
  const [checks,   setChecks]   = useState([])
  const [tasks,    setTasks]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    Promise.all([api.getTeams(), api.getTimeline(), api.getDailyChecks(), api.getAutoTasks()])
      .then(([t, tl, ch, at]) => { setTeams(t); setTimeline(tl); setChecks(ch); setTasks(at) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalCompleted = teams.reduce((s, t) => s + (t.completed || 0), 0)
  const overallPct     = Math.round((totalCompleted / 793) * 100)
  const activeTeams    = teams.filter(t => t.status !== 'not_started').length
  const issueTeams     = teams.filter(t => t.issues).length

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">데이터를 불러오는 중...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center card p-8 max-w-sm">
        <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
        <p className="font-semibold text-gray-800 mb-1">백엔드 연결 실패</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 text-left">
          <b>해결 방법:</b><br/>
          1. backend/ 폴더에서 실행:<br/>
          <code className="text-blue-600">uvicorn main:app --reload</code>
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-52 bg-blue-900 flex flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-blue-800">
          <p className="text-white font-bold text-sm leading-snug">사내 자동화</p>
          <p className="text-blue-300 text-xs mt-0.5">프로젝트 관리 대시보드</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                tab === t.id ? 'bg-blue-700 text-white font-semibold shadow' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}>
              <t.icon size={16} />
              {t.label}
              {t.id === 'teams'   && issueTeams > 0  && <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{issueTeams}</span>}
              {t.id === 'daily'   && checks.length > 0 && <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">{checks.length}</span>}
            </button>
          ))}
        </nav>

        {/* 하단 진행율 */}
        <div className="px-4 py-4 border-t border-blue-800 space-y-1.5">
          <div className="flex justify-between text-xs text-blue-300">
            <span>전체 진행율</span><span className="font-bold">{overallPct}%</span>
          </div>
          <div className="h-1.5 bg-blue-800 rounded-full">
            <div className="h-1.5 bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-blue-500 mt-1">
            <span>{activeTeams}/{teams.length}팀 참여</span>
            <span>{totalCompleted}건 완료</span>
          </div>
          <p className="text-blue-600 text-xs pt-1">AX팀 주관 · 3주 계획</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1">
            <h1 className="text-gray-800 font-bold text-lg">{TABS.find(t=>t.id===tab)?.label}</h1>
            <p className="text-gray-400 text-xs">전 부서 · 12팀 · 40명 · 793건 자동화 대상</p>
          </div>
          <div className="flex items-center gap-2">
            {issueTeams > 0 && (
              <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">
                <AlertCircle size={12}/>{issueTeams}팀 이슈
              </span>
            )}
            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">
              {timeline.length}주차 설정 중
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
              <Clock size={12}/>2026.03.10
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {tab === 'dashboard' && <TabDashboard teams={teams} timeline={timeline} />}
          {tab === 'teams'     && <TabTeams     teams={teams} onTeamsChange={setTeams} tasks={tasks} onTasksChange={setTasks} />}
          {tab === 'daily'     && <TabDaily     teams={teams} checks={checks} onChecksChange={setChecks} />}
          {tab === 'timeline'  && <TabTimeline  timeline={timeline} onTimelineChange={setTimeline} tasks={tasks} onTasksChange={setTasks} />}
          {tab === 'tasks'     && <TabTasks     teams={teams} tasks={tasks} onTasksChange={setTasks} />}
        </main>
      </div>
    </div>
  )
}

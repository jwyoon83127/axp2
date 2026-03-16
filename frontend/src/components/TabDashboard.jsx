import { useMemo } from 'react'
import { Users, CheckCircle2, TrendingUp, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const AUTO_TYPES = [
  { name: '업무 자동화',   count: 192 },
  { name: '모니터링/알림', count: 124 },
  { name: '문서 작성',     count: 97  },
  { name: '데이터 분석',   count: 81  },
  { name: '운영 관리',     count: 74  },
  { name: '개발 작업',     count: 55  },
  { name: '정산/결제',     count: 39  },
  { name: '기타',          count: 131 },
]
const TYPE_COLORS = ['#1F4E79','#2E75B6','#4472C4','#70AD47','#ED7D31','#7030A0','#C55A11','#A5A5A5']

const TOTAL_TASKS = 793

function KpiCard({ label, value, sub, icon: Icon, color, pct }) {
  const p = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   bar: 'bg-blue-500'   },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  bar: 'bg-green-500'  },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-500', bar: 'bg-orange-500' },
  }[color]
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
        </div>
        <div className={`p-2 rounded-lg ${p.bg}`}><Icon size={18} className={p.text} /></div>
      </div>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full">
        <div className={`h-1.5 rounded-full transition-all duration-700 ${p.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

export default function TabDashboard({ teams, timeline }) {
  const totalCompleted = useMemo(() => teams.reduce((s, t) => s + (t.completed || 0), 0), [teams])
  const activeTeams    = teams.filter(t => t.status !== 'not_started').length
  const overallPct     = Math.round((totalCompleted / TOTAL_TASKS) * 100)

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="참여 팀"     value={`${activeTeams} / ${teams.length}`} sub="팀 착수 완료"            icon={Users}        color="blue"   pct={(activeTeams/teams.length)*100} />
        <KpiCard label="자동화 완료" value={`${totalCompleted}건`}              sub={`전체 ${TOTAL_TASKS}건 중`} icon={CheckCircle2} color="green"  pct={overallPct} />
        <KpiCard label="전체 진행율" value={`${overallPct}%`}                   sub="완료 건수 기준"            icon={TrendingUp}   color="purple" pct={overallPct} />
        <KpiCard label="등록 주차"   value={`${timeline.length}주차`}           sub={`총 ${timeline.length}단계`} icon={Calendar}  color="orange" pct={(timeline.length/4)*100} />
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* 자동화 유형 차트 */}
        <div className="col-span-3 card p-5">
          <h3 className="text-gray-700 font-semibold text-sm mb-4">
            자동화 유형별 현황 <span className="text-gray-400 font-normal">(총 793건)</span>
          </h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={AUTO_TYPES} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={76} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => [`${v}건`]} cursor={{ fill: '#f0f4ff' }} />
              <Bar dataKey="count" radius={[0, 5, 5, 0]}>
                {AUTO_TYPES.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 팀별 진행 */}
        <div className="col-span-2 card p-5 overflow-auto">
          <h3 className="text-gray-700 font-semibold text-sm mb-4">팀별 진행 현황</h3>
          <div className="space-y-2.5">
            {teams.map(team => {
              const pct = team.totalTasks > 0 ? Math.round(((team.completed||0) / team.totalTasks) * 100) : 0
              return (
                <div key={team.id} className="flex items-center gap-2">
                  <span className="text-xs w-20 truncate flex-shrink-0 text-gray-600">{team.name}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: team.color }} />
                  </div>
                  <span className="text-gray-400 text-xs w-7 text-right flex-shrink-0">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 로드맵 */}
      <div className="card p-5">
        <h3 className="text-gray-700 font-semibold text-sm mb-4">프로젝트 로드맵</h3>
        {timeline.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">타임라인 탭에서 주차를 추가하세요.</p>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(timeline.length, 4)}, 1fr)` }}>
            {timeline.map((week, idx) => (
              <div key={week.id} className="rounded-xl p-4 border-2 border-transparent"
                style={{ backgroundColor: week.color + '14', borderColor: idx === 0 ? week.color + '80' : 'transparent' }}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-white text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: week.color }}>{week.label}</span>
                  <span className="text-gray-500 text-xs">{week.range}</span>
                </div>
                <p className="font-semibold text-gray-800 text-sm mb-2">{week.theme}</p>
                <ul className="space-y-1">
                  {week.days.slice(0, 3).map((d, i) => (
                    <li key={i} className="text-gray-500 text-xs flex gap-1.5">
                      <span className="font-semibold flex-shrink-0">{d.date}</span>
                      <span className="truncate">{d.tasks[0]?.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

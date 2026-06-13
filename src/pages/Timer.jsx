import { useTimer } from '@/hooks/useTimer'
import { useAuth } from '@/context/AuthContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function Section({ title, children }) {
  return (
    <div className="border border-gray-200 rounded p-5">
      {title && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">{title}</p>}
      {children}
    </div>
  )
}

function pad(n) {
  return String(n).padStart(2, '0')
}

export default function Timer() {
  const { currentUser } = useAuth()
  const {
    minutes, seconds, progress,
    running, isBreak,
    todaySessions, todayMinutes,
    history,
    start, pause, reset, clearHistory,
  } = useTimer(currentUser?.userId)

  const chartData = history.map(d => ({
    date: d.date.slice(5),
    세션: d.sessions,
    분: d.minutes,
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-base font-semibold text-gray-900">집중 타이머</h1>
          <p className="text-xs text-gray-400 mt-0.5">뽀모도로 방식 · 25분 집중 / 5분 휴식</p>
        </div>
        {(todaySessions > 0 || history.some(d => d.sessions > 0)) && (
          <button
            onClick={() => {
              if (!window.confirm('타이머 기록을 전부 초기화할까요?')) return
              clearHistory()
            }}
            className="text-xs text-gray-400 border border-gray-200 rounded px-2.5 py-1 hover:border-red-300 hover:text-red-400 transition-colors"
          >
            기록 초기화
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Timer */}
        <Section>
          <div className="flex flex-col items-center py-4 gap-6">
            {/* Mode label */}
            <span className={`text-xs font-medium px-2.5 py-1 border rounded ${
              isBreak
                ? 'border-gray-300 text-gray-500'
                : 'border-blue-300 text-blue-700'
            }`}>
              {isBreak ? '휴식 중' : '집중 중'}
            </span>

            {/* Circular progress */}
            <div className="relative w-44 h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke={isBreak ? '#9ca3af' : '#2563eb'}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 tabular-nums">
                  {pad(minutes)}:{pad(seconds)}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {isBreak ? '5분 휴식' : '25분 집중'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {running ? (
                <button
                  onClick={pause}
                  className="px-5 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  일시정지
                </button>
              ) : (
                <button
                  onClick={start}
                  className="px-5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  시작
                </button>
              )}
              <button
                onClick={reset}
                className="px-5 py-1.5 text-xs font-medium border border-gray-200 text-gray-400 rounded hover:text-gray-700 transition-colors"
              >
                리셋
              </button>
            </div>
          </div>
        </Section>

        {/* Today stats */}
        <div className="space-y-3">
          <Section title="오늘 현황">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center py-2">
                <p className="text-2xl font-bold text-gray-900">{todaySessions}</p>
                <p className="text-xs text-gray-400 mt-0.5">완료 세션</p>
              </div>
              <div className="text-center py-2">
                <p className="text-2xl font-bold text-gray-900">{todayMinutes}</p>
                <p className="text-xs text-gray-400 mt-0.5">누적 분</p>
              </div>
            </div>
          </Section>

          <Section title="이번 주 세션">
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={chartData} margin={{ top: 0, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f1f1f1" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [`${v}세션`, '완료']}
                  labelStyle={{ fontSize: 10, color: '#6b7280' }}
                  contentStyle={{ fontSize: 10, borderRadius: 4, border: '1px solid #e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="세션"
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Section>
        </div>
      </div>

      <Section title="사용 안내">
        <ul className="space-y-1.5">
          {[
            '25분 집중 후 자동으로 5분 휴식으로 전환됩니다.',
            '세션 완료 시 오늘 통계에 자동 기록됩니다.',
            '누적 집중 시간은 브라우저에 저장됩니다.',
          ].map((t, i) => (
            <li key={i} className="text-xs text-gray-500 flex gap-1.5">
              <span className="text-gray-300 shrink-0">—</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

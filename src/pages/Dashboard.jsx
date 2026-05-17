import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { useGraduation } from '@/hooks/useGraduation'
import { useBadge } from '@/hooks/useBadge'
import Button from '@/components/Button'
import Input from '@/components/Input'

const CATEGORY_LABELS = {
  전필: '전공필수',
  전선: '전공선택',
  교필: '공통교양',
  교선: '균형/일반교양',
  자선: '자유선택',
}

const TYPE_COLOR = {
  전필: 'text-blue-600 bg-blue-50',
  전선: 'text-indigo-600 bg-indigo-50',
  교필: 'text-emerald-600 bg-emerald-50',
  교선: 'text-amber-600 bg-amber-50',
  자선: 'text-gray-500 bg-gray-100',
}

const ADMISSION_YEARS = Array.from({ length: 12 }, (_, i) => String(2026 - i))

const LEVELS = [
  { min: 0,   max: 25,  emoji: '🌱', label: '새내기' },
  { min: 25,  max: 50,  emoji: '📚', label: '중급생' },
  { min: 50,  max: 75,  emoji: '💻', label: '고학년' },
  { min: 75,  max: 100, emoji: '🎯', label: '졸업예정자' },
  { min: 100, max: Infinity, emoji: '🎓', label: '졸업가능!' },
]

function getLevel(pct, isGraduatable) {
  if (isGraduatable) return LEVELS[LEVELS.length - 1]
  return LEVELS.slice(0, -1).find(l => pct >= l.min && pct < l.max) || LEVELS[LEVELS.length - 2]
}

function Section({ title, children, action }) {
  return (
    <div className="border border-gray-200 rounded-lg p-5">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

function ProgressBar({ label, completed, required }) {
  const pct = Math.min((completed / required) * 100, 100)
  const done = completed >= required
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className={done ? 'text-gray-900 font-medium' : 'text-gray-600'}>
          {CATEGORY_LABELS[label] || label}
          {done && <span className="ml-1.5 text-blue-500 text-[10px]">✓ 충족</span>}
        </span>
        <span className="text-gray-400 tabular-nums">{completed} / {required}학점</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${done ? 'bg-blue-500' : 'bg-blue-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function CourseTag({ courseId, courseName, courseType, onRemove }) {
  const typeStyle = TYPE_COLOR[courseType] || 'text-gray-500 bg-gray-100'
  return (
    <div className="inline-flex items-center gap-1.5 border border-gray-200 text-xs px-2 py-1 rounded-md">
      <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${typeStyle}`}>{courseType}</span>
      <span className="text-gray-700">{courseName}</span>
      <button
        onClick={() => onRemove(courseId)}
        className="text-gray-300 hover:text-gray-500 leading-none ml-0.5"
      >
        ×
      </button>
    </div>
  )
}

export default function Dashboard() {
  const {
    state,
    dispatch,
    statusByCategory,
    totalCompleted,
    totalRequired,
    isGraduatable,
    warnings,
    allCourses,
  } = useGraduation()

  const badges = useBadge({ statusByCategory, isGraduatable })
  const [courseQuery, setCourseQuery] = useState('')
  const [courseTypeFilter, setCourseTypeFilter] = useState('전체')
  const [addedToast, setAddedToast] = useState('')
  const toastTimerRef = useRef(null)

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      studentId: state.studentId,
      admissionYear: state.admissionYear,
    },
  })

  useEffect(() => {
    reset({ studentId: state.studentId, admissionYear: state.admissionYear })
  }, [state.studentId, state.admissionYear, reset])

  const onSetStudent = useCallback(
    (data) => dispatch({ type: 'SET_STUDENT', payload: data }),
    [dispatch]
  )
  const removeCourse = useCallback(
    (id) => dispatch({ type: 'REMOVE_COURSE', payload: id }),
    [dispatch]
  )
  const addCourse = useCallback(
    (id) => {
      dispatch({ type: 'ADD_COURSE', payload: id })
      const name = allCourses[id]?.name || id
      setAddedToast(name)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setAddedToast(''), 1800)
    },
    [dispatch, allCourses]
  )

  const completionPct = totalRequired > 0
    ? Math.min(Math.round((totalCompleted / totalRequired) * 100), 100)
    : 0
  const level = useMemo(() => getLevel(completionPct, isGraduatable), [completionPct, isGraduatable])
  const nextLevel = useMemo(() => LEVELS[LEVELS.indexOf(level) + 1] || null, [level])
  const creditsToNext = useMemo(() => {
    if (!nextLevel) return 0
    return Math.max(Math.ceil((nextLevel.min / 100) * totalRequired) - totalCompleted, 0)
  }, [nextLevel, totalRequired, totalCompleted])

  const donutData = [
    { name: '이수', value: totalCompleted },
    { name: '잔여', value: Math.max(totalRequired - totalCompleted, 0) },
  ]

  const barData = Object.entries(statusByCategory).map(([cat, s]) => ({
    name: CATEGORY_LABELS[cat] || cat,
    이수: s.completed,
    필요: s.required,
  }))

  const filteredAddCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase()
    const admYear = parseInt(state.admissionYear)
    return Object.entries(allCourses).filter(([id, course]) => {
      if (state.completedCourses.includes(id)) return false
      if (courseTypeFilter !== '전체' && course.type !== courseTypeFilter) return false
      if (course.type === '교선' && course.openYears) {
        if (!course.openYears.includes(admYear)) return false
        if (!q && courseTypeFilter !== '교선') return false
      }
      if (!q) return true
      return course.name.toLowerCase().includes(q) || id.includes(q) || course.type.includes(q)
    })
  }, [allCourses, state.completedCourses, courseQuery, courseTypeFilter, state.admissionYear])

  const isFirstVisit = state.completedCourses.length === 0 && !state.studentId

  return (
    <div className="space-y-5">
      {addedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2 rounded-full z-50 whitespace-nowrap">
          {addedToast} 추가됨
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h1 className="text-base font-semibold text-gray-900">졸업 요건 대시보드</h1>
          <p className="text-xs text-gray-400 mt-0.5">계명대학교 컴퓨터공학과</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
          isGraduatable
            ? 'border-blue-200 text-blue-600 bg-blue-50'
            : 'border-gray-200 text-gray-500'
        }`}>
          {isGraduatable ? '졸업 가능' : '요건 미충족'}
        </span>
      </div>

      {/* Onboarding */}
      {isFirstVisit && (
        <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center">
          <p className="text-sm font-medium text-gray-600">GradPath에 오신 것을 환영합니다</p>
          <p className="text-xs text-gray-400 mt-1.5">
            아래 학생 정보를 입력하고 이수한 과목을 추가하면<br />졸업요건 달성률을 실시간으로 확인할 수 있습니다.
          </p>
        </div>
      )}

      {/* Level & Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="나의 레벨">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{level.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{level.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {!nextLevel
                  ? '모든 레벨 달성!'
                  : creditsToNext === 0
                  ? '영역별 요건을 충족하면 졸업 가능!'
                  : `다음 레벨까지 ${creditsToNext}학점`}
              </p>
            </div>
            <span className="text-lg font-bold text-gray-900 tabular-nums shrink-0">{completionPct}%</span>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </Section>

        <Section title="달성 뱃지">
          <div className="flex flex-wrap gap-2">
            {badges.map(badge => (
              <div
                key={badge.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all duration-300 border ${
                  badge.earned
                    ? 'border-blue-200 text-blue-700 bg-blue-50'
                    : 'border-gray-100 text-gray-300 bg-gray-50'
                }`}
              >
                <span className={badge.earned ? '' : 'grayscale opacity-40'}>{badge.emoji}</span>
                <span className={badge.earned ? 'font-medium' : ''}>{badge.label}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Student Info */}
      <Section title="학생 정보">
        <form onSubmit={handleSubmit(onSetStudent)} className="flex flex-wrap gap-3 items-end">
          <div className="w-36">
            <Input
              label="학번 (7자리)"
              placeholder="2220001"
              maxLength={7}
              error={errors.studentId?.message}
              {...register('studentId', {
                required: '학번을 입력해주세요',
                pattern: { value: /^\d{7}$/, message: '7자리 숫자로 입력해주세요' },
              })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">입학연도</label>
            <select
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-blue-400 bg-white"
              {...register('admissionYear', { required: true })}
            >
              {ADMISSION_YEARS.map(y => (
                <option key={y} value={y}>{y}학년도</option>
              ))}
            </select>
          </div>
          <Button type="submit">저장</Button>
        </form>
        {state.studentId && (
          <p className="mt-3 text-xs text-gray-400">
            {state.studentId} · {state.admissionYear}학번 · 졸업요건 {totalRequired}학점
          </p>
        )}
      </Section>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="전체 이수율">
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip formatter={(v) => `${v}학점`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{completionPct}%</span>
              <span className="text-xs text-gray-400 mt-0.5">{totalCompleted} / {totalRequired}학점</span>
            </div>
          </div>
          {totalCompleted === 0 && (
            <p className="text-center text-xs text-gray-300 -mt-2">과목을 추가하면 이수율이 표시됩니다</p>
          )}
        </Section>

        <Section title="영역별 이수 현황">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="이수" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="필요" fill="#e5e7eb" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* Progress */}
      <Section title="영역별 진행률">
        <div className="space-y-4">
          {Object.entries(statusByCategory).map(([cat, s]) => (
            <ProgressBar key={cat} label={cat} completed={s.completed} required={s.required} />
          ))}
        </div>
      </Section>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Section title="미충족 항목">
          <ul className="space-y-2">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-2 items-start">
                <span className="text-gray-300 shrink-0 mt-px">—</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Completed Courses */}
      <Section
        title={`이수 과목 (${state.completedCourses.length})`}
      >
        {state.completedCourses.length === 0 ? (
          <p className="text-xs text-gray-400 py-3">이수한 과목이 없습니다. 아래에서 추가하세요.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {state.completedCourses.map(id => (
              <CourseTag
                key={id}
                courseId={id}
                courseName={allCourses[id]?.name || id}
                courseType={allCourses[id]?.type || ''}
                onRemove={removeCourse}
              />
            ))}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">과목 추가</p>
            <span className="text-[10px] text-gray-300">{filteredAddCourses.length}개</span>
          </div>

          <input
            type="text"
            value={courseQuery}
            onChange={e => setCourseQuery(e.target.value)}
            placeholder="과목명으로 검색"
            className="w-full mb-2.5 px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-blue-400 placeholder-gray-300"
          />

          <div className="flex gap-1 flex-wrap mb-3">
            {['전체', '전필', '전선', '교필', '교선', '자선'].map(t => (
              <button
                key={t}
                onClick={() => setCourseTypeFilter(t)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                  courseTypeFilter === t
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-200 text-gray-400 hover:border-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {filteredAddCourses.length === 0 ? (
            <p className="text-xs text-gray-300 py-2">
              {courseQuery.trim()
                ? '검색 결과가 없습니다'
                : courseTypeFilter === '교선'
                  ? '해당 입학년도에 개설된 교선 과목이 없습니다'
                  : courseTypeFilter === '전체'
                    ? '과목명 또는 코드를 검색하거나 교선 탭을 선택하세요'
                    : '모든 과목을 이수했습니다'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
              {filteredAddCourses.map(([id, course]) => (
                <button
                  key={id}
                  onClick={() => addCourse(id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-200 text-gray-600 rounded-md hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${TYPE_COLOR[course.type] || 'text-gray-400 bg-gray-100'}`}>
                    {course.type}
                  </span>
                  {course.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

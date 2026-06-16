import { useState, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSimulator } from '@/hooks/useSimulator'
import Button from '@/components/Button'

const CATEGORY_LABELS = {
  전필: '전공필수',
  전선: '전공선택',
  교필: '공통교양',
  교선: '균형/일반교양',
  자선: '자유선택',
}

const TYPE_COLOR = {
  전필: 'text-blue-600',
  전선: 'text-gray-500',
  교필: 'text-gray-500',
  교선: 'text-gray-500',
  자선: 'text-gray-500',
}

function Section({ title, children, className = '' }) {
  return (
    <div className={`border border-gray-200 rounded p-4 ${className}`}>
      {title && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>}
      {children}
    </div>
  )
}

function CategoryDiffRow({ cat, current, projected }) {
  const diff = projected.completed - current.completed
  const pctBefore = Math.min((current.completed / current.required) * 100, 100)
  const pctAfter  = Math.min((projected.completed / projected.required) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{CATEGORY_LABELS[cat] || cat}</span>
        <span className="text-gray-400">
          {current.completed}
          {diff > 0 && <span className="text-blue-600 font-medium"> → {projected.completed}</span>}
          /{current.required}학점
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-sm overflow-hidden relative">
        <div
          className="absolute h-full bg-gray-300 rounded-sm transition-all duration-300"
          style={{ width: `${pctAfter}%` }}
        />
        <div
          className="absolute h-full bg-blue-600 rounded-sm transition-all duration-300"
          style={{ width: `${pctBefore}%` }}
        />
      </div>
      {projected.isSatisfied && !current.isSatisfied && (
        <p className="text-xs text-blue-600">요건 충족</p>
      )}
    </div>
  )
}

function CourseRow({ courseId, course, isAlreadyDone, isSimulated, onAdd, allCourses }) {
  return (
    <div className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 ${
      isAlreadyDone ? 'opacity-40' : ''
    }`}>
      <div className="min-w-0">
        <span className="text-xs text-gray-800 font-medium">{course.name}</span>
        <span className={`ml-2 text-xs ${TYPE_COLOR[course.type] || 'text-gray-400'}`}>{course.type}</span>
        <span className="ml-1.5 text-xs text-gray-400">{course.credits}학점</span>
        {course.prerequisites.length > 0 && (
          <span className="ml-1.5 text-xs text-gray-300">
            선수: {course.prerequisites.map(id => allCourses[id]?.name || id).join(', ')}
          </span>
        )}
      </div>
      {isAlreadyDone ? (
        <span className="text-xs text-gray-300 shrink-0">완료</span>
      ) : isSimulated ? (
        <span className="text-xs text-blue-500 shrink-0">추가됨</span>
      ) : (
        <button
          onClick={() => onAdd(courseId)}
          className="text-xs text-gray-400 hover:text-blue-600 shrink-0 transition-colors"
        >
          + 추가
        </button>
      )}
    </div>
  )
}

export default function Simulator() {
  const {
    state,
    simulatedCourses,
    statusByCategory,
    projectedStatus,
    projectedTotal,
    projectedWarnings,
    isProjectedGraduatable,
    totalCompleted,
    addToSimulation,
    removeFromSimulation,
    resetSimulation,
    allCourses,
    requirements,
  } = useSimulator()

  const [searchQuery, setSearchQuery] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const errorTimerRef = useRef(null)
  useEffect(() => () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current) }, [])

  const filteredCourses = useMemo(() => {
    if (!state.studentId) return []
    const q = searchQuery.trim().toLowerCase()
    const admYear = parseInt(state.admissionYear)
    return Object.entries(allCourses).filter(([id, c]) => {
      if (c.type === '교선' && c.openYears) {
        if (!c.openYears.includes(admYear)) return false
        if (!q) return false
      }
      if (!q) return true
      return c.name.toLowerCase().includes(q) || id.toLowerCase().includes(q) || c.type.includes(q)
    })
  }, [searchQuery, allCourses, state.admissionYear, state.studentId])

  const handleAdd = useCallback((courseId) => {
    const result = addToSimulation(courseId)
    if (!result.success) {
      setErrorMsg(`선수과목 필요: ${result.missing.join(', ')}`)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      errorTimerRef.current = setTimeout(() => setErrorMsg(''), 3000)
    }
  }, [addToSimulation])

  if (!state.studentId) {
    return (
      <div className="space-y-5">
        <div className="pb-2 border-b border-gray-100">
          <h1 className="text-base font-semibold text-gray-900">졸업 시뮬레이터</h1>
          <p className="text-xs text-gray-400 mt-0.5">수강 예정 과목을 추가해 졸업 가능 여부를 확인하세요</p>
        </div>
        <div className="border border-dashed border-blue-200 rounded-lg px-6 py-10 text-center bg-blue-50/30">
          <p className="text-sm font-semibold text-gray-700">학생 정보를 먼저 등록해주세요</p>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed mb-5">
            학번과 입학연도가 등록되어야 시뮬레이터를 사용할 수 있습니다.
          </p>
          <Link
            to="/"
            className="inline-block text-xs font-medium text-blue-500 border border-blue-200 rounded px-4 py-1.5 hover:bg-blue-50 transition-colors"
          >
            대시보드에서 등록하기 →
          </Link>
        </div>
      </div>
    )
  }

  const creditDiff = projectedTotal - totalCompleted
  const remainingAfter = Math.max(requirements.totalRequired - projectedTotal, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-base font-semibold text-gray-900">졸업 시뮬레이터</h1>
          <p className="text-xs text-gray-400 mt-0.5">수강 예정 과목을 추가해 졸업 가능 여부를 확인하세요</p>
        </div>
        {simulatedCourses.length > 0 && (
          <button
            onClick={resetSimulation}
            className="text-xs text-gray-400 hover:text-gray-700 underline"
          >
            초기화
          </button>
        )}
      </div>

      {simulatedCourses.length === 0 && !searchQuery && (
        <div className="border border-blue-100 bg-blue-50/40 rounded-md px-4 py-3">
          <p className="text-xs font-medium text-blue-600 mb-1">이렇게 사용해보세요</p>
          <ol className="space-y-0.5 text-xs text-blue-500 list-decimal list-inside">
            <li>왼쪽 검색창에서 수강 예정 과목을 찾아 <span className="font-medium">+ 추가</span> 클릭</li>
            <li>오른쪽에서 졸업 가능 여부와 영역별 학점 변화 확인</li>
            <li>이미 이수한 과목은 대시보드에서 먼저 추가해주세요</li>
          </ol>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Course list */}
        <div className="lg:col-span-3 space-y-3">
          <Section>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="과목명, 과목코드, 영역으로 검색"
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            {errorMsg && (
              <p className="mt-2 text-xs text-red-500">{errorMsg}</p>
            )}
          </Section>

          <Section className="max-h-[520px] overflow-y-auto">
            {filteredCourses.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">검색 결과가 없습니다.</p>
            ) : (
              filteredCourses.map(([id, course]) => (
                <CourseRow
                  key={id}
                  courseId={id}
                  course={course}
                  isAlreadyDone={state.completedCourses.includes(id)}
                  isSimulated={simulatedCourses.includes(id)}
                  onAdd={handleAdd}
                  allCourses={allCourses}
                />
              ))
            )}
          </Section>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-2 space-y-3">
          {/* Verdict */}
          <Section>
            <div className="text-center py-1">
              <p className={`text-sm font-semibold ${
                isProjectedGraduatable ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {isProjectedGraduatable ? '졸업 가능' : '요건 미충족'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {projectedTotal}학점
                {creditDiff > 0 && <span className="text-blue-600 ml-1">(+{creditDiff})</span>}
              </p>
              {!isProjectedGraduatable && remainingAfter > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">잔여 {remainingAfter}학점</p>
              )}
            </div>
          </Section>

          {/* Basket */}
          <Section title={`추가된 과목 (${simulatedCourses.length})`}>
            {simulatedCourses.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">과목을 추가하세요</p>
            ) : (
              <div className="space-y-1">
                {simulatedCourses.map(id => {
                  const c = allCourses[id]
                  return (
                    <div key={id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700">{c?.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">{c?.credits}학점</span>
                        <button
                          onClick={() => removeFromSimulation(id)}
                          className="text-gray-300 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          {/* Category diff */}
          <Section title="영역별 변화">
            <p className="text-xs text-gray-400 mb-3">파란색 = 현재, 회색 = 시뮬레이션 후</p>
            <div className="space-y-3">
              {Object.entries(statusByCategory).map(([cat, current]) => (
                <CategoryDiffRow
                  key={cat}
                  cat={cat}
                  current={current}
                  projected={projectedStatus[cat] || current}
                />
              ))}
            </div>
          </Section>

          {/* Warnings */}
          {projectedWarnings.length > 0 && (
            <Section title="잔여 경고">
              <ul className="space-y-1.5">
                {projectedWarnings.slice(0, 5).map((w, i) => (
                  <li key={i} className="text-xs text-gray-500 flex gap-1.5">
                    <span className="text-gray-300 shrink-0">—</span>
                    <span>{w}</span>
                  </li>
                ))}
                {projectedWarnings.length > 5 && (
                  <li className="text-xs text-gray-400">외 {projectedWarnings.length - 5}개</li>
                )}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

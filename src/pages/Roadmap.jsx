import { useState, useCallback, useEffect } from 'react'
import { collection, onSnapshot, deleteDoc, addDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import roadmapsData from '@/data/roadmaps.json'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import { useAuth } from '@/context/AuthContext'

const STORAGE_KEY = 'gradpath_my_roadmap'
const GOAL_OPTIONS = ['취업', '대학원', '자격증']

// ── 관리자 직접 등록 모달 ──────────────────────────────────────────
function AdminAddModal({ onClose }) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('취업')
  const [goalDetail, setGoalDetail] = useState('')
  const [year1, setYear1] = useState('')
  const [year2, setYear2] = useState('')
  const [year3, setYear3] = useState('')
  const [year4, setYear4] = useState('')
  const [activities, setActivities] = useState('')
  const [companies, setCompanies] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toArray(str) { return str.split('\n').map(s => s.trim()).filter(Boolean) }
  function toCommaSplit(str) { return str.split(/[\n,]/).map(s => s.trim()).filter(Boolean) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'adminRoadmaps'), {
        name: name.trim(),
        goal,
        goalDetail: goalDetail.trim(),
        yearPlan: {
          '1학년': toCommaSplit(year1),
          '2학년': toCommaSplit(year2),
          '3학년': toCommaSplit(year3),
          '4학년': toCommaSplit(year4),
        },
        activities: toArray(activities),
        targetCompanies: toCommaSplit(companies),
        fromPostId: null,
        createdAt: serverTimestamp(),
      })
      onClose()
    } catch {
      alert('로드맵 등록에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white border border-gray-200 rounded-lg w-full max-w-xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">로드맵 직접 등록</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">로드맵 이름</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 백엔드 개발자 로드맵"
                className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">목표</label>
              <select value={goal} onChange={e => setGoal(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                {GOAL_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">목표 상세</label>
            <input value={goalDetail} onChange={e => setGoalDetail(e.target.value)} placeholder="예: 대기업 백엔드 엔지니어"
              className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">
              학년별 계획 <span className="normal-case text-gray-400">(쉼표 또는 줄바꿈으로 구분)</span>
            </label>
            <div className="space-y-1.5">
              {[['1학년', year1, setYear1], ['2학년', year2, setYear2], ['3학년', year3, setYear3], ['4학년', year4, setYear4]].map(([label, val, setter]) => (
                <div key={label} className="flex gap-2 items-center">
                  <span className="text-[10px] text-gray-400 w-10 shrink-0">{label}</span>
                  <input value={val} onChange={e => setter(e.target.value)} placeholder="예: C프로그래밍, 자료구조"
                    className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">
              활동 <span className="normal-case text-gray-400">(줄바꿈으로 구분)</span>
            </label>
            <textarea value={activities} onChange={e => setActivities(e.target.value)}
              placeholder="예: 백준 Gold 달성&#10;사이드 프로젝트" rows={4}
              className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400 resize-none" />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">
              목표 기업/기관 <span className="normal-case text-gray-400">(쉼표 또는 줄바꿈)</span>
            </label>
            <input value={companies} onChange={e => setCompanies(e.target.value)} placeholder="예: 카카오, 네이버"
              className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
          </div>
        </form>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50">취소</button>
          <button onClick={handleSubmit} disabled={!name.trim() || submitting}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-40">
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 로드맵 카드 ──────────────────────────────────────────────────
function RoadmapCard({ roadmap, isSaved, onSave, onDetail, isAdminEntry, onDelete, currentUser }) {
  const yearKeys = Object.keys(roadmap.yearPlan)

  return (
    <div className="border border-gray-200 rounded p-4 flex flex-col gap-3 hover:border-gray-400 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-xs font-semibold text-gray-900">{roadmap.name}</h3>
            {isAdminEntry && (
              <span className="text-[9px] font-medium text-blue-500 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded shrink-0">관리자</span>
            )}
          </div>
          <p className="text-xs text-gray-400">{roadmap.goalDetail}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded">{roadmap.goal}</span>
          {isAdminEntry && currentUser?.isAdmin && (
            <button onClick={() => onDelete(roadmap.id)} className="text-[9px] text-red-400 hover:text-red-600">삭제</button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {yearKeys.map((year) => (
          <div key={year} className="flex gap-3 text-xs">
            <span className="text-gray-400 shrink-0 w-12">{year}</span>
            <span className="text-gray-600">
              {roadmap.yearPlan[year].slice(0, 3).join(', ')}
              {roadmap.yearPlan[year].length > 3 && ` 외 ${roadmap.yearPlan[year].length - 3}개`}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-300">{roadmap.activities.length}개 활동</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => onDetail(roadmap)}>상세</Button>
          <Button size="sm" variant={isSaved ? 'secondary' : 'primary'} onClick={() => onSave(roadmap)}>
            {isSaved ? '저장됨' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ roadmap, isOpen, onClose, isSaved, onSave }) {
  if (!roadmap) return null
  const yearKeys = Object.keys(roadmap.yearPlan)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={roadmap.name}>
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        <p className="text-xs text-gray-400">{roadmap.goalDetail}</p>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">학년별 계획</p>
          <div className="space-y-3">
            {yearKeys.map((year) => (
              <div key={year}>
                <p className="text-xs font-medium text-gray-700 mb-1">{year}</p>
                <ul className="space-y-0.5 pl-2">
                  {roadmap.yearPlan[year].map((course, i) => (
                    <li key={i} className="text-xs text-gray-500 flex gap-2">
                      <span className="text-gray-300">—</span>{course}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">활동</p>
          <ul className="space-y-1">
            {roadmap.activities.map((act, i) => (
              <li key={i} className="text-xs text-gray-600 flex gap-2">
                <span className="text-gray-300">—</span>{act}
              </li>
            ))}
          </ul>
        </div>

        {roadmap.targetCompanies?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">목표 기업/기관</p>
            <div className="flex flex-wrap gap-1.5">
              {roadmap.targetCompanies.map((c, i) => (
                <span key={i} className="text-xs border border-gray-200 text-gray-600 px-2 py-0.5 rounded">{c}</span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100">
          <Button className="w-full" variant={isSaved ? 'secondary' : 'primary'} onClick={() => { onSave(roadmap); onClose() }}>
            {isSaved ? '이미 저장됨' : '내 계획으로 저장'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Roadmap() {
  const { currentUser } = useAuth()
  const [filter, setFilter] = useState('전체')
  const [selectedRoadmap, setSelectedRoadmap] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saveToast, setSaveToast] = useState('')
  const [adminRoadmaps, setAdminRoadmaps] = useState([])
  const [adminLoadError, setAdminLoadError] = useState(false)
  const [showAdminAdd, setShowAdminAdd] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [savedPlan, setSavedPlan] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // Firestore 관리자 로드맵 구독
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'adminRoadmaps'),
      snapshot => {
        setAdminRoadmaps(snapshot.docs.map(d => ({ ...d.data(), id: d.id, _isAdmin: true })))
        setAdminLoadError(false)
      },
      () => setAdminLoadError(true)
    )
    return unsubscribe
  }, [])

  const allRoadmaps = [...roadmapsData, ...adminRoadmaps]
  const goals = ['전체', '취업', '대학원', '자격증']

  const filtered = allRoadmaps.filter(r => filter === '전체' || r.goal === filter)

  const handleSave = useCallback((roadmap) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmap))
    setSavedPlan(roadmap)
    setSaveToast(roadmap.name)
  }, [])

  useEffect(() => {
    if (!saveToast) return
    const id = setTimeout(() => setSaveToast(''), 2000)
    return () => clearTimeout(id)
  }, [saveToast])

  const handleClearPlan = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSavedPlan(null)
  }, [])

  const handleDetail = useCallback((roadmap) => {
    setSelectedRoadmap(roadmap)
    setIsModalOpen(true)
  }, [])

  async function confirmDeleteAdminRoadmap() {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    try {
      await deleteDoc(doc(db, 'adminRoadmaps', id))
      if (savedPlan?.id === id) {
        localStorage.removeItem(STORAGE_KEY)
        setSavedPlan(null)
      }
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">선배 로드맵</h1>
          <p className="text-xs text-gray-400 mt-0.5">다양한 목표를 가진 선배들의 4년 계획을 참고하세요</p>
        </div>
        {currentUser?.isAdmin && (
          <button
            onClick={() => setShowAdminAdd(true)}
            className="px-3 py-1.5 text-xs font-medium text-blue-500 border border-blue-200 rounded-md hover:bg-blue-50"
          >
            + 로드맵 직접 등록
          </button>
        )}
      </div>

      {savedPlan && (
        <div className="flex items-center justify-between border border-blue-200 rounded px-4 py-3">
          <div>
            <p className="text-xs text-blue-600 font-medium mb-0.5">내 계획</p>
            <p className="text-xs text-gray-700">{savedPlan.name}</p>
          </div>
          <button onClick={handleClearPlan} className="text-xs text-gray-400 hover:text-gray-600">초기화</button>
        </div>
      )}

      <div className="flex gap-1.5">
        {goals.map(g => (
          <button
            key={g}
            onClick={() => setFilter(g)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
              filter === g ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {g}
            <span className="ml-1 opacity-60">
              {g === '전체' ? allRoadmaps.length : allRoadmaps.filter(r => r.goal === g).length}
            </span>
          </button>
        ))}
      </div>

      {adminLoadError && (
        <p className="text-xs text-red-400 text-center py-2">관리자 로드맵을 불러오지 못했습니다.</p>
      )}

      {filtered.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-16">해당 유형의 로드맵이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(roadmap => (
            <RoadmapCard
              key={roadmap.id}
              roadmap={roadmap}
              isSaved={savedPlan?.id === roadmap.id}
              onSave={handleSave}
              onDetail={handleDetail}
              isAdminEntry={!!roadmap._isAdmin}
              onDelete={setPendingDeleteId}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      <DetailModal
        roadmap={selectedRoadmap}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isSaved={savedPlan?.id === selectedRoadmap?.id}
        onSave={handleSave}
      />

      {showAdminAdd && <AdminAddModal onClose={() => setShowAdminAdd(false)} />}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white border border-gray-200 rounded-lg p-5 w-72 mx-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">로드맵 삭제</p>
            <p className="text-xs text-gray-500 mb-4">이 로드맵을 삭제할까요? 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteAdminRoadmap}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2 rounded-full z-50 whitespace-nowrap">
          "{saveToast}" 로드맵이 저장되었습니다
        </div>
      )}
    </div>
  )
}

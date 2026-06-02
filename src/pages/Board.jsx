import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, addDoc, onSnapshot, doc,
  updateDoc, deleteDoc, arrayRemove,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

const CATEGORY_COLORS = {
  진로질문: 'bg-blue-50 text-blue-600 border-blue-100',
  취업: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  대학원: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  자격증: 'bg-amber-50 text-amber-600 border-amber-100',
  일반: 'bg-gray-100 text-gray-500 border-gray-200',
}

const GOAL_OPTIONS = ['취업', '대학원', '자격증']

function categoryToGoal(cat) {
  if (cat === '취업') return '취업'
  if (cat === '대학원') return '대학원'
  if (cat === '자격증') return '자격증'
  return '취업'
}

// ── 관리자 로드맵 등록 모달 ────────────────────────────────────────────
function RoadmapRegisterModal({ post, onClose }) {
  const autoGoal = categoryToGoal(post?.category)
  const autoActivities = post?.replies?.map(r => r.content).join('\n') ?? ''

  const [name, setName] = useState(post?.title ?? '')
  const [goal, setGoal] = useState(autoGoal)
  const [goalDetail, setGoalDetail] = useState(post?.content?.slice(0, 200) ?? '')
  const [year1, setYear1] = useState('')
  const [year2, setYear2] = useState('')
  const [year3, setYear3] = useState('')
  const [year4, setYear4] = useState('')
  const [activities, setActivities] = useState(autoActivities)
  const [companies, setCompanies] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function toArray(str) {
    return str.split('\n').map(s => s.trim()).filter(Boolean)
  }
  function toCommaSplit(str) {
    return str.split(/[\n,]/).map(s => s.trim()).filter(Boolean)
  }

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
        fromPostId: post?.id ?? null,
        createdAt: serverTimestamp(),
      })
      onClose()
    } catch {
      setSubmitError('로드맵 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white border border-gray-200 rounded-lg w-full max-w-xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">로드맵 등록</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {post ? `"${post.title}"에서 자동 추출됨 — 수정 후 등록하세요` : '새 로드맵 등록'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">로드맵 이름</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="예: 백엔드 개발자 로드맵"
                className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">목표</label>
              <select
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400"
              >
                {GOAL_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">목표 상세</label>
            <input
              value={goalDetail}
              onChange={e => setGoalDetail(e.target.value)}
              placeholder="예: 대기업 백엔드 엔지니어"
              className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">학년별 계획 <span className="normal-case text-gray-400">(쉼표 또는 줄바꿈으로 구분)</span></label>
            <div className="space-y-1.5">
              {[['1학년', year1, setYear1], ['2학년', year2, setYear2], ['3학년', year3, setYear3], ['4학년', year4, setYear4]].map(([label, val, setter]) => (
                <div key={label} className="flex gap-2 items-center">
                  <span className="text-[10px] text-gray-400 w-10 shrink-0">{label}</span>
                  <input
                    value={val}
                    onChange={e => setter(e.target.value)}
                    placeholder="예: C프로그래밍, 자료구조"
                    className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">활동 <span className="normal-case text-gray-400">(줄바꿈으로 구분)</span></label>
            <textarea
              value={activities}
              onChange={e => setActivities(e.target.value)}
              placeholder="예: 백준 Gold 달성&#10;사이드 프로젝트"
              rows={4}
              className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">목표 기업/기관 <span className="normal-case text-gray-400">(쉼표 또는 줄바꿈으로 구분)</span></label>
            <input
              value={companies}
              onChange={e => setCompanies(e.target.value)}
              placeholder="예: 카카오, 네이버"
              className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400"
            />
          </div>
        </form>

        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
          {submitError && (
            <p className="text-xs text-red-500 mb-2 text-right">{submitError}</p>
          )}
          <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-40"
          >
            {submitting ? '등록 중...' : '로드맵에 등록'}
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 게시글 상세 모달 ──────────────────────────────────────────────
function PostDetail({ post, currentUser, onClose, onDeletePost, onDeleteReply, onAddToRoadmap }) {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
    <div
      className="bg-white rounded-lg border border-gray-200 w-full max-w-xl mx-4 max-h-[80vh] flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[post.category]}`}>
              {post.category}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{post.title}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">익명</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0">×</button>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>

        <div className="flex items-center gap-3">
          {currentUser?.isAdmin ? (
            <button onClick={() => onDeletePost(post.id)} className="text-[10px] text-red-400 hover:text-red-600">
              게시글 삭제
            </button>
          ) : currentUser?.userId === post.authorId && (
            post.replies?.some(r => r.authorId !== post.authorId) ? (
              <span className="text-[10px] text-gray-300">다른 사용자의 답변이 있어 삭제할 수 없습니다</span>
            ) : (
              <button onClick={() => onDeletePost(post.id)} className="text-[10px] text-red-400 hover:text-red-600">
                게시글 삭제
              </button>
            )
          )}
          {currentUser?.isAdmin && (
            <button
              onClick={() => onAddToRoadmap(post)}
              className="text-[10px] font-medium text-blue-500 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50"
            >
              + 로드맵 등록
            </button>
          )}
        </div>

        {post.replies && post.replies.length > 0 && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
              댓글 {post.replies.length}
            </p>
            {post.replies.map(reply => (
              <div key={reply.id} className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded-md px-3 py-2.5">
                  <div className="flex items-center mb-1">
                    <span className="text-[11px] font-medium text-gray-700">익명</span>
                  </div>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{reply.content}</p>
                </div>
                {currentUser?.userId === reply.authorId && (
                  <button
                    onClick={() => onDeleteReply(post.id, reply)}
                    className="text-[10px] text-gray-300 hover:text-red-400 self-start pt-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-5 py-3 flex-shrink-0">
        {currentUser ? (
          <button
            onClick={() => navigate('/board/reply', { state: { post } })}
            className="w-full py-2 text-xs font-medium text-blue-500 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
          >
            답변 작성
          </button>
        ) : (
          <p className="text-[11px] text-gray-400 text-center">댓글을 달려면 로그인이 필요합니다.</p>
        )}
      </div>
    </div>
    </div>
  )
}

// ── 메인 게시판 페이지 ─────────────────────────────────────────────
export default function Board() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [roadmapPost, setRoadmapPost] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const deleteErrorTimer = useRef(null)

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setPosts(data)
        setLoadingPosts(false)
        setFetchError(null)
        setSelectedPost(prev => prev ? (data.find(p => p.id === prev.id) ?? null) : null)
      },
      err => {
        console.error('Firestore error:', err)
        setFetchError('게시판을 불러오지 못했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.')
        setLoadingPosts(false)
      }
    )
    return unsubscribe
  }, [])

  function handleDeletePost(postId) {
    const post = posts.find(p => p.id === postId)
    if (!currentUser?.isAdmin && post?.replies?.some(r => r.authorId !== post.authorId)) return
    setPendingDelete({ type: 'post', postId, title: post?.title })
  }

  function handleDeleteReply(postId, reply) {
    setPendingDelete({ type: 'reply', postId, reply })
  }

  async function confirmDeleteAction() {
    if (!pendingDelete) return
    const { type, postId, reply } = pendingDelete
    setPendingDelete(null)
    function showDeleteError(msg) {
      setDeleteError(msg)
      if (deleteErrorTimer.current) clearTimeout(deleteErrorTimer.current)
      deleteErrorTimer.current = setTimeout(() => setDeleteError(''), 3000)
    }
    if (type === 'post') {
      try {
        await deleteDoc(doc(db, 'posts', postId))
        setSelectedPost(null)
      } catch {
        showDeleteError('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    } else {
      try {
        await updateDoc(doc(db, 'posts', postId), { replies: arrayRemove(reply) })
      } catch {
        showDeleteError('댓글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    }
  }

  const filtered = posts.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold text-gray-900">선후배 게시판</h1>
          <p className="text-xs text-gray-400 mt-0.5">졸업 후 진로, 취업, 대학원 등 선배에게 물어보세요</p>
        </div>
        {currentUser ? (
          <button
            onClick={() => navigate('/board/write')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            글쓰기
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 text-xs font-medium text-blue-500 border border-blue-200 rounded-md hover:bg-blue-50"
          >
            로그인 후 작성
          </button>
        )}
      </div>

      {deleteError && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-md">
          <p className="text-xs text-red-500">{deleteError}</p>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="제목, 내용 검색"
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
      </div>

      {fetchError ? (
        <div className="py-16 text-center">
          <p className="text-xs text-red-400">{fetchError}</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-xs text-blue-500 underline">
            새로고침
          </button>
        </div>
      ) : loadingPosts ? (
        <div className="py-16 text-center">
          <p className="text-xs text-gray-400">게시글을 불러오는 중...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-xs text-gray-400">
            {searchQuery ? '검색 결과가 없습니다.' : '아직 게시글이 없습니다. 첫 번째 글을 남겨보세요!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(post => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="border border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[post.category]}`}>
                  {post.category}
                </span>
                {post.replies && post.replies.length > 0 && (
                  <span className="text-[10px] text-blue-400 font-medium">답변 {post.replies.length}</span>
                )}
              </div>
              <p className="text-xs font-medium text-gray-900 truncate">{post.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">{post.content}</p>
              <p className="text-[10px] text-gray-400 mt-1.5">익명</p>
            </div>
          ))}
        </div>
      )}

      {selectedPost && (
        <PostDetail
          post={selectedPost}
          currentUser={currentUser}
          onClose={() => setSelectedPost(null)}
          onDeletePost={handleDeletePost}
          onDeleteReply={handleDeleteReply}
          onAddToRoadmap={(post) => { setSelectedPost(null); setRoadmapPost(post) }}
        />
      )}

      {roadmapPost !== null && (
        <RoadmapRegisterModal
          post={roadmapPost}
          onClose={() => setRoadmapPost(null)}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white border border-gray-200 rounded-lg p-5 w-72 mx-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {pendingDelete.type === 'post' ? '게시글 삭제' : '댓글 삭제'}
            </p>
            <div className="text-xs text-gray-500 mb-4">
              {pendingDelete.type === 'post' ? (
                <>
                  <p className="font-medium text-gray-700 truncate mb-1">"{pendingDelete.title}"</p>
                  <p>게시글을 삭제할까요? 댓글도 함께 삭제되며 되돌릴 수 없습니다.</p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-1 line-clamp-2">"{pendingDelete.reply?.content?.slice(0, 60)}"</p>
                  <p>댓글을 삭제할까요?</p>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

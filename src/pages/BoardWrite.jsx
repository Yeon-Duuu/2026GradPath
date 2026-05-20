import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

const CATEGORIES = ['진로질문', '취업', '대학원', '자격증', '일반']

export default function BoardWrite() {
  const { currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('진로질문')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && !currentUser) return <Navigate to="/login" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim() || submitting) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        content: content.trim(),
        category,
        authorNickname: currentUser.nickname,
        authorId: currentUser.userId,
        createdAt: serverTimestamp(),
        replies: [],
      })
      navigate('/board')
    } catch {
      setError('글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
        <h1 className="text-base font-semibold text-gray-900">새 글 쓰기</h1>
        <button
          onClick={() => navigate('/board')}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          취소
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">
            카테고리
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-400"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="질문이나 글 제목을 입력하세요"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
            maxLength={80}
            autoFocus
          />
          <p className="text-[10px] text-gray-400 mt-1 text-right">{title.length}/80</p>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">
            내용
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 자유롭게 입력하세요"
            rows={16}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none leading-relaxed"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => navigate('/board')}
            className="px-4 py-2 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !content.trim() || submitting}
            className="px-5 py-2 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  )
}

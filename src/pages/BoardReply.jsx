import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

export default function BoardReply() {
  const { currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const post = state?.post

  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!post) return <Navigate to="/board" replace />
  if (!loading && !currentUser) return <Navigate to="/login" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() || submitting) return
    setSubmitting(true)
    const reply = {
      id: Date.now().toString(),
      content: content.trim(),
      authorNickname: currentUser.nickname,
      authorId: currentUser.userId,
      createdAt: new Date().toISOString(),
    }
    try {
      await updateDoc(doc(db, 'posts', post.id), { replies: arrayUnion(reply) })
      navigate('/board')
    } catch {
      setError('답변 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
        <h1 className="text-base font-semibold text-gray-900">답변 작성</h1>
        <button
          onClick={() => navigate('/board')}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          취소
        </button>
      </div>

      {/* 원글 미리보기 */}
      <div className="border border-gray-100 rounded-lg px-4 py-3 mb-6 bg-gray-50">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">원글</p>
        <p className="text-xs font-medium text-gray-800 mb-2">{post.title}</p>
        <p className="text-xs text-gray-500 line-clamp-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        <p className="text-[10px] text-gray-400 mt-2">익명</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">
            답변 내용
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="답변을 자유롭게 작성하세요"
            rows={16}
            autoFocus
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
            disabled={!content.trim() || submitting}
            className="px-5 py-2 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? '등록 중...' : '답변 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}

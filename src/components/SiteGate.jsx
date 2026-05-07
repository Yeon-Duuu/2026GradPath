import { useState, useEffect } from 'react'

const GATE_KEY = 'gradpath_gate'
const SITE_PASSWORD = '2026'

async function hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function SiteGate({ children }) {
  const [status, setStatus] = useState('loading')
  const [correctHash, setCorrectHash] = useState('')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    hashPw(SITE_PASSWORD).then(hash => {
      setCorrectHash(hash)
      if (localStorage.getItem(GATE_KEY) === hash) {
        setStatus('unlocked')
      } else {
        setStatus('locked')
      }
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || submitting) return
    setSubmitting(true)
    const hash = await hashPw(input.trim())
    if (hash === correctHash) {
      localStorage.setItem(GATE_KEY, hash)
      setStatus('unlocked')
    } else {
      setError('비밀번호가 올바르지 않습니다.')
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xs text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (status === 'locked') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-xs border border-gray-200 rounded-lg p-6">
          <div className="mb-5">
            <h1 className="text-sm font-semibold text-gray-900">GradPath</h1>
            <p className="text-[11px] text-gray-400 mt-1">계명대학교 컴퓨터공학과 졸업요건 시뮬레이터</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">
                접근 비밀번호
              </label>
              <input
                type="password"
                value={input}
                onChange={e => { setInput(e.target.value); setError('') }}
                placeholder="비밀번호를 입력하세요"
                autoFocus
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-500 text-white text-xs font-medium py-2.5 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? '확인 중...' : '입장'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return children
}

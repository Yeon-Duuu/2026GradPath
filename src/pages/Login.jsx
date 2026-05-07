import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [registeredNickname, setRegisteredNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setRegisteredNickname('')

    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    if (tab === 'register') {
      if (userId.trim().length < 4) {
        setError('아이디는 4자 이상이어야 합니다.')
        return
      }
      if (password.length < 4) {
        setError('비밀번호는 4자 이상이어야 합니다.')
        return
      }
    }

    setSubmitting(true)

    if (tab === 'login') {
      const result = await login(userId.trim(), password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error)
      }
    } else {
      const result = await register(userId.trim(), password)
      if (result.success) {
        setRegisteredNickname(result.nickname)
      } else {
        setError(result.error)
      }
    }

    setSubmitting(false)
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setTab('login'); setError(''); setRegisteredNickname('') }}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              tab === 'login'
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'bg-gray-50 text-gray-500 hover:text-gray-700'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); setRegisteredNickname('') }}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              tab === 'register'
                ? 'bg-white text-gray-900 border-b-2 border-blue-500'
                : 'bg-gray-50 text-gray-500 hover:text-gray-700'
            }`}
          >
            회원가입
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            {tab === 'login' ? '로그인' : '새 계정 만들기'}
          </h2>
          <p className="text-[11px] text-gray-400 mb-5">
            {tab === 'login'
              ? '아이디와 비밀번호를 입력하세요.'
              : '가입 시 랜덤 닉네임이 자동으로 부여됩니다. 아이디와 비밀번호를 꼭 기억하세요.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">
                아이디
              </label>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="아이디 입력"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-500">{error}</p>
            )}

            {registeredNickname ? (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
                  <p className="text-[11px] text-green-700 mb-1">회원가입 완료!</p>
                  <p className="text-xs font-semibold text-green-800">닉네임: {registeredNickname}</p>
                  <p className="text-[10px] text-green-600 mt-1">이 닉네임은 게시판에서 사용됩니다. 꼭 기억해두세요.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2.5 rounded-md transition-colors"
                >
                  확인 — 시작하기
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium py-2.5 rounded-md transition-colors mt-1"
              >
                {submitting ? '처리 중...' : tab === 'login' ? '로그인' : '가입하기'}
              </button>
            )}
          </form>

          {tab === 'register' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md">
              <p className="text-[10px] text-amber-700 leading-relaxed">
                회원가입 후 부여된 닉네임으로 게시판 활동이 가능합니다.
                아이디와 비밀번호를 잊어버리면 복구할 수 없으니 꼭 기록해두세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const links = [
  { to: '/', label: '대시보드' },
  { to: '/simulate', label: '시뮬레이터' },
  { to: '/roadmap', label: '로드맵' },
  { to: '/board', label: '게시판' },
  { to: '/timer', label: '타이머' },
]

export default function Navbar() {
  const { currentUser, loading, logout, updateNickname } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      setNicknameInput(currentUser?.nickname ?? '')
      setNicknameError('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [editing])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  async function handleNicknameSave() {
    if (!nicknameInput.trim()) {
      setNicknameError('닉네임을 입력해주세요.')
      return
    }
    const result = await updateNickname(nicknameInput.trim())
    if (result?.success === false) {
      setNicknameError(result.error ?? '변경에 실패했습니다.')
      return
    }
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleNicknameSave()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-stretch h-12 gap-4">
          {/* 로고 */}
          <span className="flex items-center font-semibold text-gray-900 text-sm tracking-tight shrink-0">
            GradPath
            <span className="ml-1.5 text-[9px] font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-sm tracking-normal">계명대 CS</span>
          </span>

          {/* 네비 링크 */}
          <div className="flex items-stretch gap-0.5 flex-1 min-w-0">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center px-3 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* 로그인 상태 */}
          {!loading && (
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <NavLink
                to="/manual"
                className={({ isActive }) =>
                  `text-[10px] px-2 py-1 rounded border transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-gray-400 text-gray-700 bg-gray-50'
                      : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600'
                  }`
                }
              >
                설명서
              </NavLink>
              {currentUser ? (
                <>
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={inputRef}
                        value={nicknameInput}
                        onChange={e => setNicknameInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={20}
                        className="text-xs border border-blue-300 rounded px-2 py-0.5 w-28 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleNicknameSave}
                        className="text-[10px] text-white bg-blue-500 rounded px-2 py-1 hover:bg-blue-600"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="text-[10px] text-gray-400 hover:text-gray-600"
                      >
                        취소
                      </button>
                      {nicknameError && (
                        <span className="text-[10px] text-red-400">{nicknameError}</span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-[11px] text-gray-500 hover:text-blue-500 transition-colors whitespace-nowrap"
                      title="닉네임 변경"
                    >
                      <span className="font-medium text-gray-700">{currentUser.nickname}</span>
                      <span className="ml-1 text-[9px] text-gray-300">✎</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-[10px] text-gray-400 border border-gray-200 rounded px-2 py-1 hover:border-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `text-[11px] font-medium px-2.5 py-1 rounded border transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'text-blue-500 border-blue-200 hover:bg-blue-50'
                    }`
                  }
                >
                  로그인
                </NavLink>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

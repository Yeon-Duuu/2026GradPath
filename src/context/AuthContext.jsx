import { createContext, useContext, useState, useEffect } from 'react'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { generateNickname } from '@/utils/nicknames'

const SESSION_KEY = 'gradpath_session'

async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY)
    if (session) {
      try {
        setCurrentUser(JSON.parse(session))
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
    setLoading(false)
  }, [])

  // 관리자 계정 초기화 (Firestore에 없으면 1회 생성, 세션 내 중복 실행 방지)
  useEffect(() => {
    if (sessionStorage.getItem('gradpath_admin_checked')) return
    async function ensureAdmin() {
      const adminRef = doc(db, 'users', 'cmd')
      const snap = await getDoc(adminRef)
      if (!snap.exists()) {
        const hashed = await hashPassword('1234')
        await setDoc(adminRef, { password: hashed, nickname: '관리자', isAdmin: true })
      }
      sessionStorage.setItem('gradpath_admin_checked', '1')
    }
    ensureAdmin().catch(() => {})
  }, [])

  async function register(userId, password) {
    try {
      const ref = doc(db, 'users', userId)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        return { success: false, error: '이미 사용 중인 아이디입니다.' }
      }
      const nickname = generateNickname()
      const hashed = await hashPassword(password)
      await setDoc(ref, { password: hashed, nickname })
      const user = { userId, nickname, isAdmin: false }
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      setCurrentUser(user)
      return { success: true, nickname }
    } catch {
      return { success: false, error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
    }
  }

  async function login(userId, password) {
    try {
      const ref = doc(db, 'users', userId)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        return { success: false, error: '존재하지 않는 아이디입니다.' }
      }
      const data = snap.data()
      const hashed = await hashPassword(password)

      if (data.password !== hashed) {
        // 기존 평문 저장 계정 호환 처리 → 로그인 성공 시 해시로 자동 마이그레이션
        if (data.password !== password) {
          return { success: false, error: '비밀번호가 올바르지 않습니다.' }
        }
        await updateDoc(ref, { password: hashed })
      }

      const user = {
        userId,
        nickname: data.nickname,
        isAdmin: data.isAdmin ?? false,
        admissionYear: data.admissionYear ?? '',
        studentId: data.studentId ?? '',
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      setCurrentUser(user)
      return { success: true, admissionYear: user.admissionYear, studentId: user.studentId }
    } catch {
      return { success: false, error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
    }
  }

  async function updateStudentInfo(studentId, admissionYear) {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'users', currentUser.userId), { studentId, admissionYear })
      const updated = { ...currentUser, studentId, admissionYear }
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      setCurrentUser(updated)
    } catch {}
  }

  async function clearCompletedCourses() {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'users', currentUser.userId), { completedCourses: [] })
    } catch {}
  }

  async function resetUserData() {
    if (!currentUser) return
    try {
      await updateDoc(doc(db, 'users', currentUser.userId), {
        studentId: '',
        admissionYear: '2024',
        completedCourses: [],
        savedRoadmap: null,
      })
      const updated = { ...currentUser, studentId: '', admissionYear: '2024' }
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      localStorage.removeItem('gradpath_my_roadmap')
      setCurrentUser(updated)
    } catch {}
  }

  async function updateNickname(newNickname) {
    if (!currentUser || !newNickname.trim()) return { success: false }
    try {
      await updateDoc(doc(db, 'users', currentUser.userId), { nickname: newNickname.trim() })
      const updated = { ...currentUser, nickname: newNickname.trim() }
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      setCurrentUser(updated)
      return { success: true }
    } catch {
      return { success: false, error: '변경에 실패했습니다.' }
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, register, updateStudentInfo, updateNickname, resetUserData, clearCompletedCourses }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

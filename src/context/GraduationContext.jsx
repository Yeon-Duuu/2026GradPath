import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

const STORAGE_KEY = 'gradpath_state'

const initialState = {
  studentId: '',
  admissionYear: '2024',
  completedCourses: [],
  simulatedCourses: [],
}

function loadInitialState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...initialState, ...JSON.parse(stored) }
  } catch {}
  return initialState
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STUDENT':
      return { ...state, studentId: action.payload.studentId, admissionYear: action.payload.admissionYear }

    case 'LOAD_COURSES':
      return { ...state, completedCourses: action.payload }

    case 'ADD_COURSE':
      if (state.completedCourses.includes(action.payload)) return state
      return { ...state, completedCourses: [...state.completedCourses, action.payload] }

    case 'REMOVE_COURSE':
      return { ...state, completedCourses: state.completedCourses.filter(c => c !== action.payload) }

    case 'SIMULATE_ADD':
      if (state.simulatedCourses.includes(action.payload)) return state
      if (state.completedCourses.includes(action.payload)) return state
      return { ...state, simulatedCourses: [...state.simulatedCourses, action.payload] }

    case 'SIMULATE_REMOVE':
      return { ...state, simulatedCourses: state.simulatedCourses.filter(c => c !== action.payload) }

    case 'SIMULATE_RESET':
      return { ...state, simulatedCourses: [] }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

const GraduationContext = createContext(null)

export function GraduationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadInitialState)
  const { currentUser } = useAuth()
  const loadedUserRef = useRef(null)
  const firestoreReadyRef = useRef(false)
  const debounceRef = useRef(null)

  // localStorage 동기화
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // 로그인 시 Firestore에서 이수 과목 로드 / 로그아웃 시 초기화
  useEffect(() => {
    if (!currentUser) {
      loadedUserRef.current = null
      firestoreReadyRef.current = false
      dispatch({ type: 'RESET' })
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    if (loadedUserRef.current === currentUser.userId) return
    loadedUserRef.current = currentUser.userId
    firestoreReadyRef.current = false

    getDoc(doc(db, 'users', currentUser.userId))
      .then(snap => {
        const data = snap.exists() ? snap.data() : {}
        // studentId가 없는 계정은 과목 데이터를 로드하지 않음 (학생정보 미등록 상태)
        const courses = data.studentId && Array.isArray(data.completedCourses)
          ? data.completedCourses
          : []
        dispatch({ type: 'LOAD_COURSES', payload: courses })
        firestoreReadyRef.current = true
      })
      .catch(() => {
        dispatch({ type: 'LOAD_COURSES', payload: [] })
        firestoreReadyRef.current = true
      })
  }, [currentUser?.userId])

  // 이수 과목 변경 시 Firestore 동기화 (debounce 800ms, 초기 로드 후에만)
  useEffect(() => {
    if (!currentUser || !firestoreReadyRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateDoc(doc(db, 'users', currentUser.userId), {
        completedCourses: state.completedCourses,
      }).catch(() => {})
    }, 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [state.completedCourses, currentUser?.userId])

  return (
    <GraduationContext.Provider value={{ state, dispatch }}>
      {children}
    </GraduationContext.Provider>
  )
}

export function useGraduationContext() {
  const ctx = useContext(GraduationContext)
  if (!ctx) throw new Error('useGraduationContext must be used inside GraduationProvider')
  return ctx
}

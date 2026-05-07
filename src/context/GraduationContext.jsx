import { createContext, useContext, useReducer, useEffect } from 'react'

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

    default:
      return state
  }
}

const GraduationContext = createContext(null)

export function GraduationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

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

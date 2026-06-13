import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const STORAGE_KEY = 'gradpath_timer'
const FOCUS_MINUTES = 25
const BREAK_MINUTES = 5

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function buildHistory(stored) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  return days.map(date => ({
    date,
    sessions: stored[date]?.sessions ?? 0,
    minutes: stored[date]?.minutes ?? 0,
  }))
}

export function useTimer(userId) {
  const [isBreak, setIsBreak] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60)
  const [running, setRunning] = useState(false)
  const [todayKey, setTodayKey] = useState(getTodayKey)
  const [todaySessions, setTodaySessions] = useState(() => {
    const stored = loadStorage()
    return stored[getTodayKey()]?.sessions ?? 0
  })
  const [todayMinutes, setTodayMinutes] = useState(() => {
    const stored = loadStorage()
    return stored[getTodayKey()]?.minutes ?? 0
  })
  const [history, setHistory] = useState(() => buildHistory(loadStorage()))

  // 로그인/로그아웃 시 타이머 기록 동기화
  useEffect(() => {
    if (!userId) {
      localStorage.removeItem(STORAGE_KEY)
      setTodaySessions(0)
      setTodayMinutes(0)
      setHistory(buildHistory({}))
      return
    }
    getDoc(doc(db, 'users', userId)).then(snap => {
      const stored = snap.exists() && snap.data().timerHistory ? snap.data().timerHistory : {}
      saveStorage(stored)
      setTodaySessions(stored[getTodayKey()]?.sessions ?? 0)
      setTodayMinutes(stored[getTodayKey()]?.minutes ?? 0)
      setHistory(buildHistory(stored))
    }).catch(() => {})
  }, [userId])

  // 자정에 날짜가 바뀌면 오늘 통계 초기화
  useEffect(() => {
    const id = setInterval(() => {
      const newKey = getTodayKey()
      if (newKey === todayKey) return
      const stored = loadStorage()
      setTodayKey(newKey)
      setTodaySessions(stored[newKey]?.sessions ?? 0)
      setTodayMinutes(stored[newKey]?.minutes ?? 0)
      setHistory(buildHistory(stored))
    }, 60_000)
    return () => clearInterval(id)
  }, [todayKey])

  const intervalRef = useRef(null)
  const sessionDoneRef = useRef(false)
  const totalSeconds = isBreak ? BREAK_MINUTES * 60 : FOCUS_MINUTES * 60

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const persistSession = useCallback((addedMinutes) => {
    const today = getTodayKey()
    const stored = loadStorage()
    const prev = stored[today] || { sessions: 0, minutes: 0 }
    const updated = {
      ...stored,
      [today]: {
        sessions: prev.sessions + 1,
        minutes: prev.minutes + addedMinutes,
      },
    }
    saveStorage(updated)

    setTodaySessions(updated[today].sessions)
    setTodayMinutes(updated[today].minutes)
    setHistory(days =>
      days.map(d =>
        d.date === today
          ? { ...d, sessions: updated[today].sessions, minutes: updated[today].minutes }
          : d
      )
    )

    // Firestore 동기화 (로그인 상태일 때)
    if (userId) {
      updateDoc(doc(db, 'users', userId), { timerHistory: updated }).catch(() => {})
    }
  }, [userId])

  useEffect(() => {
    if (!running) return
    sessionDoneRef.current = false
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (!sessionDoneRef.current) {
            sessionDoneRef.current = true
            clearTimer()
            if (!isBreak) persistSession(FOCUS_MINUTES)
            setIsBreak(b => !b)
            setRunning(false)
          }
          return isBreak ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60
        }
        return prev - 1
      })
    }, 1000)
    return clearTimer
  }, [running, isBreak, clearTimer, persistSession])

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => { setRunning(false); clearTimer() }, [clearTimer])
  const reset = useCallback(() => {
    setRunning(false)
    clearTimer()
    setIsBreak(false)
    setSecondsLeft(FOCUS_MINUTES * 60)
  }, [clearTimer])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100

  return {
    minutes,
    seconds,
    progress,
    running,
    isBreak,
    todaySessions,
    todayMinutes,
    history,
    start,
    pause,
    reset,
  }
}

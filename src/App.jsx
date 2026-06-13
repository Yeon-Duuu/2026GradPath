import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GraduationProvider } from '@/context/GraduationContext'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'
import SiteGate from '@/components/SiteGate'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Simulator = lazy(() => import('@/pages/Simulator'))
const Roadmap = lazy(() => import('@/pages/Roadmap'))
const Timer = lazy(() => import('@/pages/Timer'))
const Login = lazy(() => import('@/pages/Login'))
const Board = lazy(() => import('@/pages/Board'))
const BoardWrite = lazy(() => import('@/pages/BoardWrite'))
const BoardReply = lazy(() => import('@/pages/BoardReply'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Manual = lazy(() => import('@/pages/Manual'))

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <SiteGate>
      <AuthProvider>
        <GraduationProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-white">
              <Navbar />
              <main className="max-w-5xl mx-auto px-6 py-8">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/simulate" element={<PrivateRoute><Simulator /></PrivateRoute>} />
                    <Route path="/roadmap" element={<PrivateRoute><Roadmap /></PrivateRoute>} />
                    <Route path="/timer" element={<PrivateRoute><Timer /></PrivateRoute>} />
                    <Route path="/board" element={<PrivateRoute><Board /></PrivateRoute>} />
                    <Route path="/board/write" element={<PrivateRoute><BoardWrite /></PrivateRoute>} />
                    <Route path="/board/reply" element={<PrivateRoute><BoardReply /></PrivateRoute>} />
                    <Route path="/manual" element={<PrivateRoute><Manual /></PrivateRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </BrowserRouter>
        </GraduationProvider>
      </AuthProvider>
    </SiteGate>
  )
}

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GraduationProvider } from '@/context/GraduationContext'
import { AuthProvider } from '@/context/AuthContext'
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
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/simulate" element={<Simulator />} />
                    <Route path="/roadmap" element={<Roadmap />} />
                    <Route path="/timer" element={<Timer />} />
                    <Route path="/board" element={<Board />} />
                    <Route path="/board/write" element={<BoardWrite />} />
                    <Route path="/board/reply" element={<BoardReply />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/manual" element={<Manual />} />
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

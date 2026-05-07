import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-bold text-gray-100 mb-4">404</p>
      <p className="text-sm font-medium text-gray-700 mb-1">페이지를 찾을 수 없습니다</p>
      <p className="text-xs text-gray-400 mb-6">주소를 확인하거나 아래 링크로 돌아가세요.</p>
      <Link to="/" className="text-xs text-blue-500 hover:underline">대시보드로 돌아가기</Link>
    </div>
  )
}

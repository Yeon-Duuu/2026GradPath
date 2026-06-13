export default function Manual() {
  return (
    <div className="-mx-6 -my-8 overflow-hidden">
      <iframe
        src="/manual.html"
        className="w-full border-0"
        style={{ height: 'calc(100vh - 48px)', display: 'block' }}
        title="GradPath 사용 설명서"
        scrolling="no"
      />
    </div>
  )
}

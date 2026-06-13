export default function Manual() {
  return (
    <div className="-mx-6 -my-8" style={{ overflow: 'hidden' }}>
      <iframe
        src="/manual.html"
        style={{
          height: 'calc(100vh - 48px)',
          width: 'calc(100% + 17px)',
          display: 'block',
          border: 'none',
        }}
        title="GradPath 사용 설명서"
      />
    </div>
  )
}

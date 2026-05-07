import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, id, className = '', ...props }, ref) {
  const inputId = id || (label ? `input-${label.replace(/[^a-zA-Z0-9가-힣]/g, '-')}` : undefined)
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-gray-600">{label}</label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-2.5 py-1.5 text-xs border rounded focus:outline-none focus:border-blue-500 ${
          error ? 'border-red-400' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Input

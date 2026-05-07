export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger:    'border border-red-200 text-red-600 hover:bg-red-50',
    ghost:     'text-gray-500 hover:text-gray-800',
  }

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-xs px-3 py-2',
    lg: 'text-sm px-4 py-2.5',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

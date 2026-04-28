export default function Button({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-600 hover:bg-gray-100',
    accent: 'bg-amber-500 text-white hover:bg-amber-600',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3.5 text-base gap-2',
    xl: 'px-6 py-4 text-lg gap-3',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

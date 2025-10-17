const Button = ({ children, className = '', variant = 'primary', loading = false, disabled, ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm transition-opacity'
  const variants = {
    primary: 'bg-[var(--primary)] text-white hover:opacity-90',
    outline: 'border border-[color:var(--border)] text-[color:var(--text)] hover:opacity-90',
    ghost: 'text-[color:var(--text)] hover:opacity-80',
  }
  const cls = `${base} ${variants[variant] || variants.primary} ${className}`
  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {loading ? 'Please wait…' : children}
    </button>
  )
}

export default Button

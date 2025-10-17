const Input = ({ className = '', ...props }) => {
  const base = 'w-full h-11 px-3 rounded-md border border-[color:var(--border)] bg-[var(--card)] text-[color:var(--text)]'
  return <input className={`${base} ${className}`} {...props} />
}

export default Input

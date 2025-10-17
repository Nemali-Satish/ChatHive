const Modal = ({ title, onClose, children, maxWidth = '28rem' }) => (
  <div className="fixed inset-0 z-50 grid place-items-center">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div
      className="relative z-10 w-[92vw] rounded-xl border border-[color:var(--border)] bg-[var(--card)] shadow-xl p-4"
      style={{ maxWidth }}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button className="text-sm opacity-70 hover:opacity-100" onClick={onClose} aria-label="Close dialog">Close</button>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  </div>
)

export default Modal

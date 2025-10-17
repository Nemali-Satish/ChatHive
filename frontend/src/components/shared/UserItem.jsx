const UserItem = ({ user, onAdd, loading, sent = false }) => {
  const name = user?.name || 'Unknown'
  const username = user?.username || 'user'
  const avatar = user?.avatar?.url || 'https://api.dicebear.com/9.x/thumbs/svg?seed=User'
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[var(--card)] px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <img src={avatar} alt="avatar" className="h-9 w-9 rounded-full border border-[color:var(--border)]" />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{name}</div>
          <div className="text-xs text-[color:var(--muted)] truncate">@{username}</div>
        </div>
      </div>
      {onAdd ? (
        <button
          onClick={() => onAdd(user)}
          disabled={loading || sent}
          className="text-xs px-3 py-1.5 rounded-md border border-[color:var(--border)] hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Sending…' : sent ? 'Sent' : 'Add'}
        </button>
      ) : null}
    </div>
  )
}

export default UserItem

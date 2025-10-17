import AppLayout from '../components/layout/AppLayout'
import ChatList from '../components/specific/ChatList'

const Home = () => {
  return (
    <AppLayout sidebar={<ChatList />}>
      <div className="p-2">
        <h1 className="text-2xl font-semibold">Welcome to ChatHive</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Start chatting with your contacts or create a group.</p>
        <div className="mt-6 grid gap-3">
          <div className="rounded-xl border border-[color:var(--border)] bg-[var(--card)] p-4">
            <div className="text-sm text-[color:var(--muted)]">Select a conversation from the left to begin.</div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Home

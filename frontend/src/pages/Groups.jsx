import AppLayout from '../components/layout/AppLayout'
import { useDispatch } from 'react-redux'
import { setIsNewGroup } from '../redux/reducers/misc'

const Groups = () => {
  const dispatch = useDispatch()
  return (
    <AppLayout sidebar={<div className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Your Groups</h3>
        <button onClick={() => dispatch(setIsNewGroup(true))} className="text-xs underline">New</button>
      </div>
      <div className="mt-3 text-sm text-[color:var(--muted)]">No groups yet.</div>
    </div>}>
      <div className="p-2">
        <h1 className="text-xl font-semibold">Groups</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Create and manage your groups here.</p>
        <div className="mt-4">
          <button onClick={() => dispatch(setIsNewGroup(true))} className="px-3 py-2 rounded-md bg-[var(--primary)] text-white">Create group</button>
        </div>
      </div>
    </AppLayout>
  )
}

export default Groups

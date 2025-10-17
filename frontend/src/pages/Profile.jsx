import { useSelector } from 'react-redux'
import AppLayout from '../components/layout/AppLayout'
import ChatList from '../components/specific/ChatList'
import Button from '../components/shared/Button'
import { Link } from 'react-router-dom'

const ProfileCard = ({ user }) => (
  <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
    <div className="p-6 bg-blue-400/10">
      <img src={user?.avatar?.url || 'https://api.dicebear.com/9.x/thumbs/svg?seed=User'} alt="avatar" className="h-16 w-16 rounded-xl border border-[color:var(--border)]" />
      <div className="mt-5">
        <div className="text-lg font-semibold leading-tight">{user?.name || 'Your name'}</div>
        <div className="text-sm text-slate-500 dark:text-slate-300">@{user?.username || 'username'}</div>
      </div>
    </div>
    <div className="p-6 space-y-3">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Email</div>
        <div className="text-sm">{user?.email || 'you@example.com'}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Bio</div>
        <div className="mt-1 text-sm min-h-[48px] whitespace-pre-wrap break-words">
          {user?.bio || 'Hi there, I am using ChatHive.'}
        </div>
      </div>
      <div className="pt-2 flex justify-end">
        <Link to="/setup-profile">
          <Button variant="outline">Edit profile</Button>
        </Link>
      </div>
    </div>
  </div>
)

const Profile = () => {
  const { user } = useSelector((s) => s.auth)
  return (
    <AppLayout sidebar={<ChatList />}>
      <div className="p-2">
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <div className="mt-4 max-w-2xl">
          <ProfileCard user={user} />
        </div>
      </div>
    </AppLayout>
  )
}

export default Profile

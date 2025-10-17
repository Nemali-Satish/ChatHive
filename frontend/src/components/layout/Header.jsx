import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../../redux/reducers/misc'
import { logout as logoutAction } from '../../redux/reducers/auth'
import { Moon, SunMedium, LogOut, Search, Bell, Users, Plus, Menu } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { server } from '../../constants/config'
import toast from 'react-hot-toast'
import { lazy, Suspense } from 'react'
import { setIsSearch, setIsNotification, setIsNewGroup, setMobileSidebarOpen } from '../../redux/reducers/misc'

const SearchDialog = lazy(() => import('../specific/Search'))
const NotificationsDialog = lazy(() => import('../specific/Notifications'))
const NewGroupDialog = lazy(() => import('../specific/NewGroup'))

const Header = () => {
  const dispatch = useDispatch()
  const { theme, isSearch, isNotification, isNewGroup } = useSelector((s) => s.misc)
  const { user } = useSelector((s) => s.auth)
  const { notifications = [] } = useSelector((s) => s.chat || {})
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await axios.get(`${server}/api/v1/user/logout`, { withCredentials: true })
    } catch (_) {
      // ignore network errors, proceed to clear client state
    } finally {
      dispatch(logoutAction())
      toast.success('Logged out')
      navigate('/login')
    }
  }

  return (
    <header className="app-header">
      <div className="flex items-center gap-2">
        {user ? (
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--border)]"
            onClick={() => dispatch(setMobileSidebarOpen(true))}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        ) : null}
        <Link to="/" className="font-semibold tracking-tight">
          ChatHive
        </Link>
        {user ? (
          <div className="hidden md:flex items-center gap-2 ml-4">
            <button
              className="inline-flex h-9 px-2 items-center gap-2 rounded-md border border-[color:var(--border)]"
              onClick={() => dispatch(setIsSearch(true))}
              title="Search"
            >
              <Search size={16} />
              <span className="text-sm">Search</span>
            </button>
            <Link
              to="/groups"
              className="inline-flex h-9 px-2 items-center gap-2 rounded-md border border-[color:var(--border)]"
              title="Groups"
            >
              <Users size={16} />
              <span className="text-sm">Groups</span>
            </Link>
            <button
              className="inline-flex h-9 px-2 items-center gap-2 rounded-md border border-[color:var(--border)]"
              onClick={() => dispatch(setIsNewGroup(true))}
              title="New Group"
            >
              <Plus size={16} />
              <span className="text-sm">New</span>
            </button>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <button
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--border)]"
            onClick={() => dispatch(setIsNotification(true))}
            title="Notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 ? (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] text-white grid place-items-center">
                {Math.min(notifications.length, 9)}{notifications.length > 9 ? '+' : ''}
              </span>
            ) : null}
          </button>
        ) : null}
        <button
          aria-label="Toggle theme"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--border)]"
          onClick={() => dispatch(toggleTheme())}
        >
          {theme === 'dark' ? (
            <SunMedium size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>
        {user ? (
          <>
            {/* Small screens: logout icon */}
            <button
              aria-label="Logout"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--border)]"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            {/* Larger screens: profile link */}
            <Link to="/profile" className="hidden md:inline text-sm">
              {user.name || 'Profile'}
            </Link>
            {/* Larger screens: logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-[color:var(--border)]"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/register"
              className="text-sm px-3 py-1.5 rounded-md h-9 inline-flex items-center border border-[color:var(--border)] text-[color:var(--text)] hover:opacity-90"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="text-sm px-3 py-1.5 rounded-md h-9 inline-flex items-center bg-[var(--primary)] text-white hover:opacity-90"
            >
              Login
            </Link>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Suspense fallback={null}>
        {isSearch ? <SearchDialog onClose={() => dispatch(setIsSearch(false))} /> : null}
        {isNotification ? (
          <NotificationsDialog onClose={() => dispatch(setIsNotification(false))} />
        ) : null}
        {isNewGroup ? <NewGroupDialog onClose={() => dispatch(setIsNewGroup(false))} /> : null}
      </Suspense>
    </header>
  )
}

export default Header


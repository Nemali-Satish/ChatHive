import { Navigate, Outlet } from 'react-router-dom'

/*
  Usage examples:
  - <ProtectRoute user={user} /> wraps private routes (requires completed profile)
  - <ProtectRoute user={user} requireComplete={false} /> allows access even if profile not completed (e.g., setup page)
  - <ProtectRoute user={!user} redirect="/" > <Login/> </ProtectRoute> for auth-only pages
*/
const ProtectRoute = ({ user, redirect = '/login', requireComplete = true, children }) => {
  // If this protect route is for unauthenticated-only pages
  if (typeof user === 'boolean') {
    if (user) return children ? children : <Outlet />
    return <Navigate to={redirect} replace />
  }

  // Auth required
  if (!user) return <Navigate to={redirect} replace />
  if (requireComplete && user.profileCompleted === false) return <Navigate to="/setup-profile" replace />

  return children ? children : <Outlet />
}

export default ProtectRoute

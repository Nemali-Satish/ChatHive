import { useReducer, useState } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { server } from '../constants/config'
import { userExists } from '../redux/reducers/auth'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { User2, Lock, Eye, EyeOff } from 'lucide-react'
import Button from '../components/shared/Button'
import Input from '../components/shared/Input'

const Field = ({ label, icon: Icon, children, error }) => (
  <label className="block">
    <span className="text-sm  text-[color:var(--text)]">{label}</span>
    <div className="mt-1 relative">
      {Icon ? <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /> : null}
      {children}
    </div>
    {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
  </label>
)

const Login = () => {
  const [state, setState] = useReducer((s, a) => ({ ...s, ...a }), { username: '', password: '', submitting: false })
  const [showPw, setShowPw] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Accept username OR email on login
  const identifier = state.username.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmail = emailRegex.test(identifier)
  const usernameSanitized = identifier.toLowerCase()
  const usernameValid = /^[a-z][a-z0-9_-]*$/.test(usernameSanitized)

  const errors = {}
  if (!identifier) errors.username = 'Enter username or email'
  else if (!isEmail && !usernameValid) errors.username = 'Username must start with a letter; allowed: a-z, 0-9, - and _'
  if (state.password.length < 1) errors.password = 'Password is required'
  const canSubmit = Object.keys(errors).length === 0

  const onSubmit = async () => {
    if (!canSubmit) return
    try {
      setState({ submitting: true })
      const payload = isEmail
        ? { email: identifier.toLowerCase(), password: state.password }
        : { username: usernameSanitized.toLowerCase(), password: state.password }
      const { data } = await axios.post(`${server}/api/v1/user/login`, payload, { withCredentials: true })
      dispatch(userExists(data.user))
      toast.success('Welcome back')
      navigate(data.user?.profileCompleted === false ? '/setup-profile' : '/')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed')
    } finally {
      setState({ submitting: false })
    }
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <div className="w-full max-w-md border border-[color:var(--border)] rounded-2xl p-6 bg-[var(--card)] shadow-xl">
        <h2 className="text-2xl font-semibold text-[color:var(--text)]">Welcome back</h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">Login to continue to ChatHive.</p>

        <div className="mt-6 grid gap-4">
          <Field label="Username or Email" icon={User2} error={errors.username}>
            <Input
              value={state.username}
              onChange={(e) => {
                const raw = e.target.value
                const looksLikeEmail = emailRegex.test(raw.trim())
                const v = looksLikeEmail
                  ? raw.trim().toLowerCase()
                  : raw.toLowerCase().replace(/[^a-z0-9_-]/g, '').replace(/^[^a-z]+/, '')
                setState({ username: v })
              }}
              className="pl-8 pr-3"
              placeholder="your_name or you@example.com"
              autoComplete="username"
              inputMode="latin"
              // Allow either email or username. Pattern helps but we rely on our JS validation too.
              title="Enter username (lowercase, starts with a letter; a-z, 0-9, -, _) or a valid email"
            />
          </Field>

          <Field label="Password" icon={Lock} error={errors.password}>
            <Input
              type={showPw ? 'text' : 'password'}
              value={state.password}
              onChange={(e) => setState({ password: e.target.value })}
              className="pl-8 pr-10"
              placeholder="••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              aria-label="Toggle password visibility"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>

          <Button onClick={onSubmit} disabled={!canSubmit} loading={state.submitting} className="mt-2 w-full">
            Sign in
          </Button>
        </div>

        <p className="mt-6 text-xs text-slate-600 dark:text-slate-400 text-center">
          Don’t have an account? <Link to="/register" className="underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default Login

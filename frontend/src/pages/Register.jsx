import { useMemo, useReducer, useState } from 'react'
import axios from 'axios'
import { server } from '../constants/config'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { userExists } from '../redux/reducers/auth'
import { User2, Mail, Lock, Eye, EyeOff, AtSign } from 'lucide-react'
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

const Register = () => {
  const [state, dispatch] = useReducer(
    (s, a) => ({ ...s, ...a }),
    { username: '', name: '', email: '', password: '', confirm: '', submitting: false }
  )
  const navigate = useNavigate()
  const rdispatch = useDispatch()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const errors = useMemo(() => {
    const e = {}
    const uname = state.username.toLowerCase()
    if (!state.username.trim()) e.username = 'Username is required'
    else if (!/^[a-z0-9_-]+$/.test(uname)) e.username = 'Only lowercase letters, digits, - and _ allowed'
    if (!state.name.trim()) e.name = 'Name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) e.email = 'Valid email required'
    if (state.password.length < 6) e.password = 'Min 6 characters'
    if (state.password !== state.confirm) e.confirm = 'Passwords do not match'
    return e
  }, [state.username, state.name, state.email, state.password, state.confirm])

  const canSubmit = Object.keys(errors).length === 0

  const handleSubmit = async () => {
    dispatch({ submitting: true })
    try {
      const { data } = await axios.post(
        `${server}/api/v1/user/register`,
        { username: state.username.toLowerCase(), name: state.name, email: state.email, password: state.password },
        { withCredentials: true }
      )
      toast.success('Account created')
      // store user (profileCompleted=false) and go to setup
      rdispatch(userExists(data.user))
      navigate('/setup-profile')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed')
    } finally {
      dispatch({ submitting: false })
    }
  }

  return (
    <div className="min-h-[80vh] grid place-items-center p-4">
      <div className="w-full max-w-xl border border-[color:var(--border)] rounded-2xl bg-[var(--card)] shadow-xl p-6">
        <h1 className="text-2xl font-semibold text-[color:var(--text)]">Create your account</h1>

        <div className="mt-6 grid gap-4">
          <Field label="Full name" icon={User2} error={errors.name}>
            <Input value={state.name} onChange={(e) => dispatch({ name: e.target.value })} className="pl-8 pr-3" placeholder="John Doe" />
          </Field>
          <Field label="Username" icon={AtSign} error={errors.username}>
            <Input value={state.username}
              onChange={(e) => dispatch({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
              className="pl-8 pr-3"
              placeholder="your_name" inputMode="latin" pattern="[a-z0-9_-]+" title="Only lowercase letters, digits, hyphen and underscore are allowed" />
          </Field>
          <Field label="Email" icon={Mail} error={errors.email}>
            <Input type="email" value={state.email} onChange={(e) => dispatch({ email: e.target.value })} className="pl-8 pr-3" placeholder="you@example.com" />
          </Field>

          <Field label="Password" icon={Lock} error={errors.password}>
            <Input type={showPw ? 'text' : 'password'} value={state.password} onChange={(e) => dispatch({ password: e.target.value })} className="pl-8 pr-10" placeholder="Password" />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowPw((p) => !p)} aria-label="Toggle password">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>
          <Field label="Confirm password" icon={Lock} error={errors.confirm}>
            <Input type={showConfirm ? 'text' : 'password'} value={state.confirm} onChange={(e) => dispatch({ confirm: e.target.value })} className="pl-8 pr-10" placeholder="confirm Password" />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowConfirm((p) => !p)} aria-label="Toggle confirm password">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <Link to="/login" className="underline">Have an account? Sign in</Link>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit} loading={state.submitting}>
            Create account
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Register

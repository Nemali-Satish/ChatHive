import { useMemo, useReducer, useRef, useState } from 'react'
import axios from 'axios'
import { server } from '../constants/config'
import { useDispatch, useSelector } from 'react-redux'
import { userExists } from '../redux/reducers/auth'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Input from '../components/shared/Input'
import Button from '../components/shared/Button'

const defaultAvatars = [
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Ava',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Max',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Rex',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Joy',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Luna',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=Kai',
]

// Single-step form; no progress bar needed

const Field = ({ label, children, error }) => (
  <label className="block">
    <span className="text-sm text-[color:var(--fieldText)]">{label}</span>
    <div className="mt-1">{children}</div>
    {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
  </label>
)

const DropZone = ({ onFile, preview }) => {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)
  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }
  const onChange = (e) => onFile(e.target.files?.[0])
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed p-4 flex items-center gap-4 cursor-pointer ${drag ? 'border-[color:var(--text)]' : 'border-[color:var(--border)]'}`}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      aria-label="Upload avatar"
    >
      <img src={preview} alt="preview" className="h-16 w-16 rounded-lg border border-[color:var(--border)]" />
      <div className="text-sm">
        <div className="font-medium">Drag and drop your avatar</div>
        <div className="text-[color:var(--muted)]">or click to browse</div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </div>
  )
}

const ProfileSetup = () => {
  const [state, setState] = useReducer(
    (s, a) => ({ ...s, ...a }),
    { name: '', username: '', bio: 'Hi there, I am using ChatHive.', avatarUrl: defaultAvatars[0], avatarFile: null, avatarPreview: defaultAvatars[0], submitting: false }
  )
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const navigate = useNavigate()

  // Prefill from current user
  const prefilled = useMemo(() => ({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    avatar: user?.avatar?.url || null,
  }), [user])

  // Initialize on first render when user is available
  if (user && state.name === '' && state.username === '') {
    setState({
      name: prefilled.name,
      username: prefilled.username,
      bio: state.bio,
      avatarUrl: prefilled.avatar || state.avatarUrl,
      avatarPreview: prefilled.avatar || state.avatarPreview,
    })
  }

  const errors = useMemo(() => {
    const e = {}
    if (!state.name.trim()) e.name = 'Name is required'
    if (!state.username.trim()) e.username = 'Username is required'
    if (!state.bio.trim()) e.bio = 'Bio is required'
    return e
  }, [state.name, state.username, state.bio])

  const onPickAvatar = (url) => setState({ avatarUrl: url, avatarFile: null, avatarPreview: url })
  const onUploadAvatar = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setState({ avatarFile: file, avatarPreview: reader.result })
    reader.readAsDataURL(file)
  }

  const onSubmit = async () => {
    setState({ submitting: true })
    try {
      const payload = { name: state.name, bio: state.bio }
      if (state.avatarFile) payload.avatarBase64 = state.avatarPreview
      else payload.avatarUrl = state.avatarUrl
      const { data } = await axios.put(`${server}/api/v1/user/profile`, payload, { withCredentials: true })
      toast.success('Profile completed')
      dispatch(userExists(data.user))
      navigate('/')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to complete profile')
    } finally {
      setState({ submitting: false })
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold">Complete your profile</h1>
            <p className="text-sm text-slate-600 ">Review your info, choose an avatar, and save.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Profile preview card */}
            <aside className="lg:col-span-4">
              <div className="sticky top-6">
                <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
                  <div className="p-6 bg-blue-400/10">
                    <img src={state.avatarPreview} alt="avatar" className="h-16 w-16 rounded-xl border border-[color:var(--border)]" />
                    <div className="mt-5">
                      <div className="text-lg font-semibold leading-tight">{user?.name || 'Your name'}</div>
                      <div className="text-sm text-slate-300">@{user?.username || 'username'}</div>
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
                        {state.bio}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avatar chooser card */}
                <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[var(--card)] p-5 shadow-lg">
                  <h2 className="text-base font-medium">Choose an avatar</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Pick from defaults or upload your own.</p>
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {defaultAvatars.map((url) => (
                      <button key={url} type="button" onClick={() => onPickAvatar(url)} className={`rounded-full border p-1 transition-colors ${state.avatarUrl === url && !state.avatarFile ? 'border-[color:var(--text)]' : 'border-[color:var(--border)] hover:opacity-80'}`}>
                        <img src={url} alt="avatar" className="rounded-full" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <DropZone onFile={onUploadAvatar} preview={state.avatarPreview} />
                  </div>
                </div>
              </div>
            </aside>

            {/* Right: Single-step editor */}
            <section className="lg:col-span-8">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[var(--card)] p-5 space-y-4 shadow-lg">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" error={errors.name}>
                    <Input value={state.name} onChange={(e) => setState({ name: e.target.value })} className="h-10" placeholder="John Doe" />
                  </Field>
                  <Field label="Username" error={errors.username}>
                    <div className="relative text-[color:var(--disabled)]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">@</span>
                      <Input value={state.username} className="h-10 pl-7 pr-3" placeholder="username" disabled />
                    </div>
                  </Field>
                </div>
                <Field label="Bio" error={errors.bio}>
                  <div>
                    <textarea value={state.bio} onChange={(e) => setState({ bio: e.target.value })} rows={8} className="mt-1 w-full px-3 py-2 rounded-lg border border-[color:var(--border)] bg-transparent text-[color:var(--text)]" placeholder="Tell us about yourself" />
                    <div className="mt-1 text-xs text-slate-500 text-right">{state.bio.length}/280</div>
                  </div>
                </Field>

                <div className="flex justify-end">
                  <Button type="button" onClick={onSubmit} disabled={Object.keys(errors).length > 0} loading={state.submitting}>
                    Save profile
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSetup

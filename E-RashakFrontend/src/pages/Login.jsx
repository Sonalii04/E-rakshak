import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MdPerson, MdLock, MdVisibility, MdVisibilityOff, MdSecurity } from 'react-icons/md'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [role, setRole] = useState('OFFICER')

  const { signIn, signUp } = useAuth()
  const { showToast } = useToast()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (isRegisterMode) {
        if (!username.trim() || !password.trim()) {
          throw new Error(t('auth.missingCredentials') || 'Username and password are required.')
        }
        await signUp(username.trim(), password, role)
        showToast({
          type: 'success',
          title: 'Registration Successful',
          message: `User ${username} has been registered. You can now sign in.`
        })
        setIsRegisterMode(false)
        setError('')
      } else {
        await signIn(username || 'r.sharma', password || 'demo', rememberMe)
        showToast({ type: 'success', title: t('auth.signInSuccessTitle'), message: t('auth.signInSuccessMessage') })
        const redirectTo = location.state?.from?.pathname || '/dashboard'
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      setError(err.message || (isRegisterMode ? 'Registration failed. Try a different username.' : t('auth.signInErrorDefault')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md animate-fadeIn">
      <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
        <div className="flex h-12 w-12 items-center justify-center rounded-control bg-secondary text-white">
          <MdSecurity className="h-6 w-6" />
        </div>
        <p className="text-lg font-bold text-primary dark:text-slate-100">SentryVision</p>
      </div>

      <div className="card-surface p-8">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary-700 dark:bg-secondary-600/15 dark:text-secondary-100">
          {t('auth.restrictedAccess')}
        </div>
        <h2 className="mt-3 text-2xl font-bold text-primary dark:text-slate-100">
          {isRegisterMode ? 'Investigator Registration' : t('auth.title')}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isRegisterMode 
            ? 'Create a new investigator account with assigned role permissions.' 
            : t('auth.subtitle')}
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 flex border-b border-slate-200 dark:border-primary-400/20">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false)
              setError('')
            }}
            className={`flex-1 pb-2.5 text-center text-sm font-semibold transition-colors ${
              !isRegisterMode
                ? 'border-b-2 border-secondary text-secondary'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            {t('auth.signIn') || 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true)
              setError('')
            }}
            className={`flex-1 pb-2.5 text-center text-sm font-semibold transition-colors ${
              isRegisterMode
                ? 'border-b-2 border-secondary text-secondary'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-control border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="label-text">{t('auth.usernameLabel')}</label>
            <div className="relative">
              <MdPerson className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegisterMode ? 'badge_id_or_name' : 'r.sharma'}
                className="input-field pl-10"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-text">{t('auth.passwordLabel')}</label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10 pr-10"
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={t('auth.togglePassword')}
              >
                {showPassword ? <MdVisibilityOff className="h-5 w-5" /> : <MdVisibility className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="label-text">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
              >
                <option value="OFFICER">Officer</option>
                <option value="ANALYST">Analyst</option>
                <option value="VIEWER">Viewer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          )}

          {!isRegisterMode && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-secondary focus:ring-secondary/30"
                />
                {t('auth.rememberMe')}
              </label>
              <button type="button" className="text-sm font-medium text-secondary hover:text-secondary-700">
                {t('auth.forgotPassword')}
              </button>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {isSubmitting 
              ? (isRegisterMode ? 'Registering...' : t('auth.signingIn')) 
              : (isRegisterMode ? 'Register' : t('auth.signIn'))}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          {t('auth.footerNotice')}
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  MdPerson,
  MdLanguage,
  MdDarkMode,
  MdNotifications,
  MdSecurity,
  MdInfo,
} from 'react-icons/md'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { classNames } from '../utils/formatters'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { language, setLanguage, t, languages } = useLanguage()

  const TABS = [
    { id: 'profile', label: t('settings.tabs.profile'), icon: MdPerson },
    { id: 'language', label: t('settings.tabs.language'), icon: MdLanguage },
    { id: 'theme', label: t('settings.tabs.theme'), icon: MdDarkMode },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: MdNotifications },
    { id: 'security', label: t('settings.tabs.security'), icon: MdSecurity },
    { id: 'system', label: t('settings.tabs.system'), icon: MdInfo },
  ]

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    highConfidenceOnly: true,
    dailyDigest: true,
  })

  function saveChanges() {
    showToast({ type: 'success', title: t('settings.savedToastTitle'), message: t('settings.savedToastMessage') })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary dark:text-slate-100">{t('settings.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="card-surface flex flex-row gap-1 overflow-x-auto p-2 lg:flex-col">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                'flex items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2.5 text-sm font-medium transition',
                activeTab === tab.id
                  ? 'bg-secondary text-white'
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-primary-400/10'
              )}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="card-surface p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary dark:text-slate-100">{t('settings.profile.heading')}</h3>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-lg font-bold text-white">
                  {(user?.username || 'IO').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="font-semibold text-primary dark:text-slate-100">{user?.username || 'Inspector R. Sharma'}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">{user?.id || 'PD-22910'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-text">{t('settings.profile.fullName')}</label>
                  <input type="text" defaultValue={user?.username || 'Inspector R. Sharma'} className="input-field" />
                </div>
                <div>
                  <label className="label-text">{t('settings.profile.badgeId')}</label>
                  <input type="text" defaultValue={user?.id || 'PD-22910'} className="input-field" disabled />
                </div>
                <div>
                  <label className="label-text">{t('settings.profile.department')}</label>
                  <input type="text" defaultValue={user?.department || 'Cyber & Surveillance Cell'} className="input-field" />
                </div>
                <div>
                  <label className="label-text">{t('settings.profile.role')}</label>
                  <input type="text" defaultValue={user?.role || 'Investigating Officer'} className="input-field" disabled />
                </div>
              </div>
              <button onClick={saveChanges} className="btn-primary">{t('common.save')}</button>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary dark:text-slate-100">{t('settings.language.heading')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.language.subtitle')}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {languages.map((lang) => (
                  <label
                    key={lang.code}
                    className="flex cursor-pointer items-center gap-2 rounded-control border border-slate-200 px-3 py-2.5 text-sm dark:border-primary-400/30"
                  >
                    <input
                      type="radio"
                      name="language"
                      checked={language === lang.code}
                      onChange={() => setLanguage(lang.code)}
                      className="accent-secondary"
                    />
                    {lang.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary dark:text-slate-100">{t('settings.theme.heading')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.theme.subtitle')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={classNames(
                    'flex-1 rounded-control border-2 p-4 text-left',
                    theme === 'light' ? 'border-secondary bg-secondary-50 dark:bg-secondary-600/10' : 'border-slate-200 dark:border-primary-400/30'
                  )}
                >
                  <p className="text-sm font-semibold text-primary dark:text-slate-100">{t('settings.theme.light')}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('settings.theme.lightDesc')}</p>
                </button>
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={classNames(
                    'flex-1 rounded-control border-2 p-4 text-left',
                    theme === 'dark' ? 'border-secondary bg-secondary-50 dark:bg-secondary-600/10' : 'border-slate-200 dark:border-primary-400/30'
                  )}
                >
                  <p className="text-sm font-semibold text-primary dark:text-slate-100">{t('settings.theme.dark')}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('settings.theme.darkDesc')}</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary dark:text-slate-100">{t('settings.notifications.heading')}</h3>
              {[
                { key: 'email', label: t('settings.notifications.email'), description: t('settings.notifications.emailDesc') },
                { key: 'sms', label: t('settings.notifications.sms'), description: t('settings.notifications.smsDesc') },
                { key: 'highConfidenceOnly', label: t('settings.notifications.highConfidence'), description: t('settings.notifications.highConfidenceDesc') },
                { key: 'dailyDigest', label: t('settings.notifications.dailyDigest'), description: t('settings.notifications.dailyDigestDesc') },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-control border border-slate-100 p-4 dark:border-primary-400/20">
                  <div>
                    <p className="text-sm font-semibold text-primary dark:text-slate-100">{item.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{item.description}</p>
                  </div>
                  <button
                    onClick={() => setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={classNames(
                      'relative h-6 w-11 flex-shrink-0 rounded-full transition-colors',
                      notifications[item.key] ? 'bg-secondary' : 'bg-slate-200 dark:bg-primary-400/30'
                    )}
                  >
                    <span
                      className={classNames(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                        notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>
              ))}
              <button onClick={saveChanges} className="btn-primary">{t('common.save')}</button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary dark:text-slate-100">{t('settings.security.heading')}</h3>
              <div>
                <label className="label-text">{t('settings.security.currentPassword')}</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-text">{t('settings.security.newPassword')}</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label-text">{t('settings.security.confirmNewPassword')}</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-control border border-slate-100 p-4 dark:border-primary-400/20">
                <div>
                  <p className="text-sm font-semibold text-primary dark:text-slate-100">{t('settings.security.twoFactor')}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('settings.security.twoFactorDesc')}</p>
                </div>
                <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700 dark:bg-accent-600/15 dark:text-accent-100">{t('settings.security.enabled')}</span>
              </div>
              <button onClick={saveChanges} className="btn-primary">{t('settings.security.updateButton')}</button>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-primary dark:text-slate-100">{t('settings.system.heading')}</h3>
              <dl className="divide-y divide-slate-100 text-sm dark:divide-primary-400/20">
                {[
                  [t('settings.system.appVersion'), 'SentryVision v2.4.1'],
                  [t('settings.system.backendStatus'), t('settings.system.backendStatusValue')],
                  [t('settings.system.lastSync'), t('settings.system.lastSyncValue')],
                  [t('settings.system.dataRetention'), t('settings.system.dataRetentionValue')],
                  [t('settings.system.deploymentEnv'), t('settings.system.deploymentEnvValue')],
                  [t('settings.system.supportContact'), 'support@sentryvision.gov.in'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <dt className="text-slate-400 dark:text-slate-500">{label}</dt>
                    <dd className="font-medium text-primary dark:text-slate-100">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

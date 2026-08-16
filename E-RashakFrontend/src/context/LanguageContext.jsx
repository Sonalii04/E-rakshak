import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { LANGUAGES, translations } from '../i18n/translations'

const LanguageContext = createContext(null)

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('sentryvision_language') || 'en')

  const setLanguage = useCallback((code) => {
    setLanguageState(code)
    localStorage.setItem('sentryvision_language', code)
  }, [])

  const t = useCallback(
    (key, vars) => {
      let str = getNested(translations[language], key) ?? getNested(translations.en, key) ?? key
      if (typeof str === 'string' && vars) {
        Object.entries(vars).forEach(([varKey, value]) => {
          str = str.replace(`{{${varKey}}}`, value)
        })
      }
      return str
    },
    [language]
  )

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, setLanguage, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

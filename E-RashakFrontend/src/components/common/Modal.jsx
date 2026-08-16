import { useEffect } from 'react'
import { MdClose } from 'react-icons/md'
import { classNames } from '../../utils/formatters'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const { t } = useLanguage()
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-primary-900/50 px-4 animate-fadeIn">
      <div
        className={classNames(
          'w-full rounded-card bg-white shadow-popover dark:bg-primary-600',
          widths[size]
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-primary-400/20">
          <h3 className="text-base font-semibold text-primary dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-primary-400/20"
            aria-label={t('components.modal.close')}
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-primary-400/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

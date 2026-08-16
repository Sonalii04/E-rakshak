import { MdFindInPage } from 'react-icons/md'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function EmptyState({
  icon: Icon = MdFindInPage,
  title,
  description,
  action = null,
}) {
  const { t } = useLanguage()
  const resolvedTitle = title === undefined ? t('components.emptyState.defaultTitle') : title
  const resolvedDescription = description === undefined ? t('components.emptyState.defaultDesc') : description
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center animate-fadeIn">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-primary-700 dark:text-slate-500">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-base font-semibold text-primary dark:text-slate-100">{resolvedTitle}</p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{resolvedDescription}</p>
      {action}
    </div>
  )
}

import { useState } from 'react'
import { MdSearch, MdMic, MdImage } from 'react-icons/md'
import { useLanguage } from '../../context/LanguageContext.jsx'

export default function SearchBar({ value, onChange, onSubmit, onImageUpload, isSearching }) {
  const { t } = useLanguage()
  const EXAMPLES = [t('searchBar.example1'), t('searchBar.example2'), t('searchBar.example3')]
  const [placeholderIndex] = useState(() => Math.floor(Math.random() * EXAMPLES.length))

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit?.()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 rounded-control border border-slate-200 bg-white p-2 shadow-soft transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 dark:border-primary-400/30 dark:bg-primary-600">
        <MdSearch className="ml-2 h-6 w-6 flex-shrink-0 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={EXAMPLES[placeholderIndex]}
          className="flex-1 border-none bg-transparent px-1 py-3 text-base text-primary outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
        <label
          className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-control text-slate-400 transition hover:bg-slate-100 dark:hover:bg-primary-400/20"
          title={t('searchBar.uploadTitle')}
        >
          <MdImage className="h-5 w-5" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onImageUpload?.(e.target.files?.[0])}
          />
        </label>
        <button
          type="button"
          title={t('searchBar.voiceTitle')}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control text-slate-400 transition hover:bg-slate-100 dark:hover:bg-primary-400/20"
        >
          <MdMic className="h-5 w-5" />
        </button>
        <button type="submit" disabled={isSearching} className="btn-primary flex-shrink-0 px-6">
          {isSearching ? t('searchBar.searching') : t('searchBar.searchButton')}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onChange(example)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition hover:border-secondary hover:text-secondary dark:border-primary-400/30 dark:bg-primary-600 dark:text-slate-400"
          >
            {example}
          </button>
        ))}
      </div>
    </form>
  )
}

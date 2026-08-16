import { useState, useEffect } from 'react'
import {
  MdDescription,
  MdPictureAsPdf,
  MdCode,
  MdArchive,
  MdAdd,
} from 'react-icons/md'
import ReportCard from '../components/cards/ReportCard.jsx'
import Modal from '../components/common/Modal.jsx'
import Loader from '../components/common/Loader.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { getReports, generateReport } from '../services/reportService.js'
import { getSearchHistory } from '../services/searchService.js'
import { useToast } from '../context/ToastContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { formatDateTime } from '../utils/formatters'

export default function Reports() {
  const { data: reports, isLoading, error, refetch } = useAsync(getReports, [])
  const { showToast } = useToast()
  const { t } = useLanguage()
  const [selectedReport, setSelectedReport] = useState(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [history, setHistory] = useState([])
  const [selectedSearch, setSelectedSearch] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    getSearchHistory().then(data => {
      setHistory(data || [])
      if (data && data.length > 0) {
        setSelectedSearch(data[0].id)
      }
    }).catch(() => {})
  }, [])

  async function handleGenerate() {
    const search = history.find((s) => s.id === selectedSearch)
    setIsGenerating(true)
    try {
      const newReport = await generateReport({
        title: search?.query || 'Untitled Report',
        query: search?.query || '',
        cameras: search?.filters?.camera 
          ? [search.filters.camera] 
          : search?.filters?.location 
            ? [search.filters.location] 
            : ['All Cameras'],
        rangeStart: search?.timestamp || new Date().toISOString(),
        rangeEnd: search?.timestamp || new Date().toISOString(),
        matches: search?.resultCount || 0,
        generatedBy: search?.officer || 'System',
        generatedAt: search?.timestamp || new Date().toISOString(),
      })
      setShowGenerate(false)
      setSelectedReport(newReport)
      showToast({ type: 'success', title: t('reports.reportGeneratedTitle'), message: t('reports.reportGeneratedMessage', { id: newReport.id }) })
      refetch()
    } finally {
      setIsGenerating(false)
    }
  }

  function handleExport(format) {
    showToast({ type: 'info', title: t('reports.exportQueuedTitle'), message: t('reports.exportQueuedMessage', { format, id: selectedReport?.id }) })
  }

  if (isLoading) return <Loader label={t('reports.loading')} fullHeight />
  if (error) return <ErrorState description={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-slate-100">{t('reports.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('reports.subtitle')}</p>
        </div>
        <button onClick={() => setShowGenerate(true)} className="btn-primary">
          <MdAdd className="h-4 w-4" /> {t('reports.generateReport')}
        </button>
      </div>

      {reports.length === 0 ? (
        <EmptyState icon={MdDescription} title={t('reports.noReportsTitle')} description={t('reports.noReportsDesc')} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} onView={setSelectedReport} />
          ))}
        </div>
      )}

      <Modal
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        title={t('reports.modalTitle')}
        footer={
          <>
            <button onClick={() => setShowGenerate(false)} className="btn-secondary">{t('common.cancel')}</button>
            <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary">
              {isGenerating ? t('reports.generating') : t('reports.generateReport')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-text">{t('reports.sourceSearch')}</label>
            <select className="input-field" value={selectedSearch} onChange={(e) => setSelectedSearch(e.target.value)}>
              {history.map((s) => (
                <option key={s.id} value={s.id}>{s.query}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('reports.generateNote')}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.title}
        footer={
          <>
            <button onClick={() => handleExport('PDF')} className="btn-secondary">
              <MdPictureAsPdf className="h-4 w-4" /> {t('reports.exportPdf')}
            </button>
            <button onClick={() => handleExport('JSON')} className="btn-secondary">
              <MdCode className="h-4 w-4" /> {t('reports.exportJson')}
            </button>
            <button onClick={() => handleExport('ZIP')} className="btn-primary">
              <MdArchive className="h-4 w-4" /> {t('reports.downloadZip')}
            </button>
          </>
        }
      >
        {selectedReport && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="label-text mb-1">{t('reports.searchDetails')}</dt>
              <dd className="font-medium text-primary dark:text-slate-100">{selectedReport.query}</dd>
            </div>
            <div>
              <dt className="label-text mb-1">{t('reports.cameraList')}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {(selectedReport.cameras || []).map((cam) => (
                  <span key={cam} className="rounded-full bg-secondary-50 px-2 py-0.5 text-xs font-medium text-secondary-700 dark:bg-secondary-600/15 dark:text-secondary-100">{cam}</span>
                ))}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="label-text mb-1">{t('reports.rangeStart')}</dt>
                <dd className="font-medium text-primary dark:text-slate-100">{selectedReport.rangeStart ? formatDateTime(selectedReport.rangeStart) : '-'}</dd>
              </div>
              <div>
                <dt className="label-text mb-1">{t('reports.rangeEnd')}</dt>
                <dd className="font-medium text-primary dark:text-slate-100">{selectedReport.rangeEnd ? formatDateTime(selectedReport.rangeEnd) : '-'}</dd>
              </div>
            </div>
            <div>
              <dt className="label-text mb-1">{t('reports.numberOfMatches')}</dt>
              <dd className="font-medium text-primary dark:text-slate-100">{selectedReport.matches}</dd>
            </div>
            <div>
              <dt className="label-text mb-1">{t('reports.sha256Hash')}</dt>
              <dd className="break-all rounded-control bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 dark:bg-primary-700 dark:text-slate-300">{selectedReport.hash}</dd>
            </div>
            <div className="border-t border-slate-100 pt-3 dark:border-primary-400/20">
              <dt className="label-text mb-1">{t('reports.auditInformation')}</dt>
              <dd className="text-slate-500 dark:text-slate-400">
                {t('reports.generatedBy')} <span className="font-medium text-primary dark:text-slate-200">{selectedReport.generatedBy}</span>
                {selectedReport.generatedAt && <> {t('reports.on')} {formatDateTime(selectedReport.generatedAt)}</>}
              </dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  )
}

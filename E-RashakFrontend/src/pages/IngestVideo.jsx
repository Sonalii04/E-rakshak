import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MdCloudUpload, MdCheckCircle, MdError, MdRefresh,
  MdVideocam, MdPlayArrow, MdStop, MdHistory,
  MdFiberManualRecord, MdChevronRight
} from 'react-icons/md'
import { API_BASE_URL } from '../utils/constants'

const STAGES = [
  { key: 'queued',    label: 'Queued',              icon: MdFiberManualRecord },
  { key: 'running',   label: 'Detecting Objects',   icon: MdPlayArrow },
  { key: 'embedding', label: 'Generating Embeddings', icon: MdRefresh },
  { key: 'merging',   label: 'Syncing Database',    icon: MdVideocam },
  { key: 'complete',  label: 'Ready to Search',     icon: MdCheckCircle },
]

function stageIndex(status) {
  return STAGES.findIndex(s => s.key === status)
}

function StatusBadge({ status }) {
  const colors = {
    queued:    'bg-slate-700 text-slate-300',
    running:   'bg-blue-900/60 text-blue-300 animate-pulse',
    embedding: 'bg-purple-900/60 text-purple-300 animate-pulse',
    merging:   'bg-amber-900/60 text-amber-300 animate-pulse',
    complete:  'bg-emerald-900/60 text-emerald-300',
    failed:    'bg-red-900/60 text-red-300',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || colors.queued}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function PipelineProgress({ status, progress }) {
  const currentIdx = stageIndex(status)
  const failed = status === 'failed'

  return (
    <div className="mt-4">
      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ${failed ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="flex items-start justify-between">
        {STAGES.map((stage, idx) => {
          const done = !failed && currentIdx > idx
          const active = !failed && currentIdx === idx
          const StageIcon = stage.icon
          return (
            <div key={stage.key} className="flex flex-1 flex-col items-center gap-1.5 text-center">
              {/* Connector line */}
              <div className="flex w-full items-center">
                {idx > 0 && (
                  <div className={`h-0.5 flex-1 transition-colors duration-500 ${done || active ? 'bg-cyan-400' : 'bg-white/10'}`} />
                )}
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300
                  ${failed && active ? 'border-red-500 bg-red-900/40 text-red-400'
                  : done ? 'border-cyan-400 bg-cyan-900/40 text-cyan-400'
                  : active ? 'border-blue-400 bg-blue-900/40 text-blue-300 shadow-lg shadow-blue-500/30'
                  : 'border-white/20 text-white/30'}`}>
                  <StageIcon className="h-4 w-4" />
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-colors duration-500 ${done ? 'bg-cyan-400' : 'bg-white/10'}`} />
                )}
              </div>
              <span className={`text-[10px] font-medium leading-tight ${
                done ? 'text-cyan-400' : active ? 'text-blue-300' : 'text-slate-500'
              }`}>{stage.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LogPanel({ log }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [log])

  return (
    <div
      ref={ref}
      className="mt-4 h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-black/40 p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400"
    >
      {log
        ? log.split('\n').map((line, i) => (
          <p key={i} className={`leading-relaxed ${line.includes('ERROR') || line.includes('FAIL') ? 'text-red-400' : line.includes('===') ? 'text-cyan-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
            {line || '\u00A0'}
          </p>
        ))
        : <p className="text-slate-400 dark:text-slate-600 italic">No logs yet…</p>
      }
    </div>
  )
}

export default function IngestVideo() {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [cameraId, setCameraId] = useState('')
  const [cameraLocation, setCameraLocation] = useState('')
  const [fps, setFps] = useState('20')
  const [uploading, setUploading] = useState(false)
  const [processedNotice, setProcessedNotice] = useState('')
  const [currentJob, setCurrentJob] = useState(null)
  const [pastJobs, setPastJobs] = useState([])
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  // Fetch past jobs on mount
  useEffect(() => {
    fetchPastJobs()
    return () => clearInterval(pollRef.current)
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('sentryvision_token') || sessionStorage.getItem('sentryvision_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const fetchPastJobs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ingest/jobs`, { headers: getAuthHeaders() })
      if (res.ok) setPastJobs(await res.json())
    } catch (_) {}
  }

  const startPolling = useCallback((jobId) => {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ingest/status/${jobId}`, { headers: getAuthHeaders() })
        if (!res.ok) return
        const data = await res.json()
        setCurrentJob(data)
        if (data.status === 'complete' || data.status === 'failed') {
          clearInterval(pollRef.current)
          fetchPastJobs()
        }
      } catch (_) {}
    }, 3000)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) setFile(f)
    else setError('Please drop a valid video file.')
  }, [])

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Please select a video file.')
    if (!cameraId.trim()) return setError('Camera ID is required.')

    setError('')
    setProcessedNotice('')
    setUploading(true)
    const form = new FormData()
    form.append('video', file)
    form.append('cameraId', cameraId.trim())
    form.append('cameraLocation', cameraLocation.trim())
    form.append('fps', fps)

    try {
      const res = await fetch(`${API_BASE_URL}/ingest/upload`, { method: 'POST', body: form, headers: getAuthHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      if (data.alreadyProcessed) {
        setProcessedNotice(data.message)
        const statusRes = await fetch(`${API_BASE_URL}/ingest/status/${data.jobId}`, { headers: getAuthHeaders() })
        if (statusRes.ok) {
          const jobData = await statusRes.json()
          setCurrentJob(jobData)
          if (jobData.status !== 'complete' && jobData.status !== 'failed') {
            startPolling(data.jobId)
          }
        }
        setFile(null)
        setCameraId('')
        setCameraLocation('')
        setFps('20')
        return
      }

      // Immediately fetch initial job state for new upload
      const statusRes = await fetch(`${API_BASE_URL}/ingest/status/${data.jobId}`, { headers: getAuthHeaders() })
      setCurrentJob(await statusRes.json())
      startPolling(data.jobId)

      // Reset form
      setFile(null)
      setCameraId('')
      setCameraLocation('')
      setFps('20')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (iso) => iso ? new Date(iso).toLocaleString() : '—'

  return (
    <div className="min-h-full space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary dark:text-slate-100">Ingest New Video</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload a CCTV recording. The system will automatically run YOLO detection, generate CLIP embeddings, and make it searchable.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Upload Form ── */}
        <div className="card-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-primary dark:text-slate-100">
            <MdCloudUpload className="h-5 w-5 text-secondary" />
            Upload Video
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onClick={() => document.getElementById('videoFileInput').click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
                ${dragActive ? 'border-cyan-400 bg-cyan-900/20' : file ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-200 dark:border-primary-400/30 hover:border-secondary dark:hover:border-secondary bg-slate-50 dark:bg-primary-700/30'}`}
            >
              <input id="videoFileInput" type="file" accept="video/*" className="sr-only" onChange={handleFileChange} />
              {file ? (
                <>
                  <MdCheckCircle className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatSize(file.size)} — click to change</p>
                </>
              ) : (
                <>
                  <MdCloudUpload className={`h-10 w-10 transition-colors ${dragActive ? 'text-secondary' : 'text-slate-400 dark:text-slate-500'}`} />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drag & drop a video file here</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">or click to browse — MP4, AVI, MOV supported</p>
                </>
              )}
            </div>

            {/* Camera fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Camera ID <span className="text-red-500">*</span></label>
                <input
                  required
                  value={cameraId}
                  onChange={e => setCameraId(e.target.value)}
                  placeholder="e.g. cam_02"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Location</label>
                <input
                  value={cameraLocation}
                  onChange={e => setCameraLocation(e.target.value)}
                  placeholder="e.g. Main Gate"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Video FPS</label>
              <select
                value={fps}
                onChange={e => setFps(e.target.value)}
                className="input-field"
              >
                {['15', '20', '24', '25', '30', '60'].map(v => (
                  <option key={v} value={v} className="bg-white text-primary dark:bg-primary-750 dark:text-slate-100">{v} FPS</option>
                ))}
              </select>
            </div>

            {processedNotice && (
              <div className="flex items-start gap-2.5 rounded-lg border border-cyan-200 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/40 p-3 text-sm text-cyan-800 dark:text-cyan-200 shadow-md">
                <MdCheckCircle className="h-5 w-5 flex-shrink-0 text-cyan-500 dark:text-cyan-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-cyan-700 dark:text-cyan-300">Video Already Processed</p>
                  <p className="mt-0.5 text-xs text-cyan-600 dark:text-cyan-200/80 leading-relaxed">{processedNotice}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                <MdError className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <><MdRefresh className="h-4 w-4 animate-spin" /> Uploading…</>
              ) : (
                <><MdCloudUpload className="h-4 w-4" /> Start Ingestion</>
              )}
            </button>
          </form>
        </div>

        {/* ── Active Job Tracker ── */}
        <div className="card-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-primary dark:text-slate-100">
            <MdPlayArrow className="h-5 w-5 text-secondary" />
            Active Job
          </h2>

          {currentJob ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary dark:text-slate-100 truncate">{currentJob.videoName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentJob.cameraId} · {currentJob.cameraLocation || '—'}</p>
                </div>
                <StatusBadge status={currentJob.status} />
              </div>

              <PipelineProgress status={currentJob.status} progress={currentJob.progress} />

              {currentJob.status === 'complete' && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <MdCheckCircle className="h-4 w-4" />
                  Video is now searchable! Go to Natural Language Search.
                </div>
              )}
              {currentJob.status === 'failed' && (
                <div className="mt-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                  <div className="flex items-center gap-2"><MdError className="h-4 w-4 text-red-500" /> Ingestion failed</div>
                  {currentJob.error && <p className="mt-1 text-xs opacity-80">{currentJob.error}</p>}
                </div>
              )}

              <LogPanel log={currentJob.log} />
            </>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
              <MdVideocam className="h-12 w-12 opacity-30" />
              <p className="text-sm">No active job. Upload a video to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Past Jobs ── */}
      <div className="card-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-primary dark:text-slate-100">
            <MdHistory className="h-5 w-5 text-slate-400" />
            Ingestion History
          </h2>
          <button
            onClick={fetchPastJobs}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-secondary dark:text-slate-400 dark:hover:bg-primary-400/10 dark:hover:text-white"
          >
            <MdRefresh className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {pastJobs.length === 0 ? (
          <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">No ingestion jobs yet.</p>
        ) : (
          <div className="space-y-2">
            {pastJobs.map(job => (
              <div
                key={job.id}
                className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 dark:border-primary-400/20 dark:bg-primary-700/40 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-primary dark:text-slate-100">{job.videoName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{job.cameraId} · {formatDate(job.createdAt)}</p>
                </div>
                <StatusBadge status={job.status} />
                <div className="w-24">
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${job.status === 'failed' ? 'bg-red-500' : 'bg-cyan-400'}`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => { setCurrentJob(job); if (!['complete','failed'].includes(job.status)) startPolling(job.id) }}
                  className="flex-shrink-0 text-slate-500 hover:text-secondary dark:text-slate-400 dark:hover:text-white transition"
                >
                  <MdChevronRight className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

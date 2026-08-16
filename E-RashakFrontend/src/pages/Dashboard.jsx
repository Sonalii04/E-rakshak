import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  MdSearch,
  MdVideocam,
  MdDescription,
  MdAssignmentTurnedIn,
} from 'react-icons/md'
import KpiCard from '../components/common/KpiCard.jsx'
import ChartCard from '../components/charts/ChartCard.jsx'
import Loader from '../components/common/Loader.jsx'
import ErrorState from '../components/common/ErrorState.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { getDashboardData } from '../services/dashboardService.js'
import { formatDateTime } from '../utils/formatters'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useAsync(getDashboardData, [])
  const { t } = useLanguage()

  const QUICK_ACTIONS = [
    { label: t('dashboard.quickActions.newSearch'), icon: MdSearch, path: '/search', tone: 'bg-secondary' },
    { label: t('dashboard.quickActions.manageCameras'), icon: MdVideocam, path: '/cameras', tone: 'bg-accent-600' },
    { label: t('dashboard.quickActions.generateReport'), icon: MdDescription, path: '/reports', tone: 'bg-warning' },
    { label: t('dashboard.quickActions.viewAuditLogs'), icon: MdAssignmentTurnedIn, path: '/audit-logs', tone: 'bg-primary-600' },
  ]

  if (isLoading) return <Loader label={t('dashboard.loading')} fullHeight />
  if (error) return <ErrorState description={error} onRetry={refetch} />

  const { kpis, searchesPerDay, detectionStats, cameraActivity, objectDistribution, recentSearches, recentExports } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-primary dark:text-slate-100">{t('dashboard.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={t('dashboard.charts.searchesPerDayTitle')} subtitle={t('dashboard.charts.searchesPerDaySubtitle')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={searchesPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }} />
              <Bar dataKey="searches" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('dashboard.charts.detectionStatsTitle')} subtitle={t('dashboard.charts.detectionStatsSubtitle')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={detectionStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="persons" name={t('dashboard.charts.legendPersons')} stroke="#2563EB" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="vehicles" name={t('dashboard.charts.legendVehicles')} stroke="#22C55E" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('dashboard.charts.cameraActivityTitle')} subtitle={t('dashboard.charts.cameraActivitySubtitle')}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cameraActivity}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }} />
              <Area type="monotone" dataKey="activity" stroke="#2563EB" strokeWidth={2.5} fill="url(#activityFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('dashboard.charts.objectDistributionTitle')} subtitle={t('dashboard.charts.objectDistributionSubtitle')}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={objectDistribution} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={2}>
                {objectDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-surface overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-primary-400/20">
            <h3 className="text-sm font-semibold text-primary dark:text-slate-100">{t('dashboard.recentSearches')}</h3>
            <button onClick={() => navigate('/search')} className="text-xs font-semibold text-secondary hover:text-secondary-700">
              {t('common.viewAll')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400 dark:border-primary-400/20">
                  <th className="px-5 py-3 font-medium">{t('dashboard.table.query')}</th>
                  <th className="px-5 py-3 font-medium">{t('dashboard.table.officer')}</th>
                  <th className="px-5 py-3 font-medium">{t('dashboard.table.matches')}</th>
                  <th className="px-5 py-3 font-medium">{t('dashboard.table.status')}</th>
                </tr>
              </thead>
              <tbody>
                {recentSearches.map((search) => (
                  <tr key={search.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 dark:border-primary-400/10 dark:hover:bg-primary-400/5">
                    <td className="max-w-xs truncate px-5 py-3 font-medium text-primary dark:text-slate-100">{search.query}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{search.user}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{search.matches}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={search.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-primary dark:text-slate-100">{t('dashboard.quickActionsTitle')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 rounded-control border border-slate-100 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-card dark:border-primary-400/20"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-control text-white ${action.tone}`}>
                  <action.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{action.label}</span>
              </button>
            ))}
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold text-primary dark:text-slate-100">{t('dashboard.recentExports')}</h3>
          <div className="space-y-2">
            {recentExports.map((exportItem) => (
              <div key={exportItem.id} className="rounded-control border border-slate-100 p-3 dark:border-primary-400/20">
                <p className="truncate text-xs font-semibold text-primary dark:text-slate-100">{exportItem.title}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>{exportItem.format} &middot; {exportItem.user}</span>
                  <span>{formatDateTime(exportItem.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

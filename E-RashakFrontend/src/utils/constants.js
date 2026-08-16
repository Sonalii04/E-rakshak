export const OBJECT_TYPES = ['Person', 'Vehicle', 'Bag', 'Weapon', 'Animal']

export const VEHICLE_TYPES = ['Hatchback', 'Sedan', 'SUV', 'Truck', 'Motorcycle', 'Bus', 'Auto Rickshaw']

export const CLOTHING_COLORS = ['Red', 'Blue', 'Black', 'White', 'Yellow', 'Green', 'Grey', 'Brown']

export const CAMERA_STATUS = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  MAINTENANCE: 'Maintenance',
}

export const STATUS_COLORS = {
  Online: { dot: 'bg-accent', text: 'text-accent-700', bg: 'bg-accent-50', border: 'border-accent-100' },
  Offline: { dot: 'bg-danger', text: 'text-red-700', bg: 'bg-danger-50', border: 'border-danger-100' },
  Maintenance: { dot: 'bg-warning', text: 'text-amber-700', bg: 'bg-warning-50', border: 'border-warning-100' },
  Completed: { dot: 'bg-accent', text: 'text-accent-700', bg: 'bg-accent-50', border: 'border-accent-100' },
  Processing: { dot: 'bg-warning', text: 'text-amber-700', bg: 'bg-warning-50', border: 'border-warning-100' },
}

export const NAV_ITEMS = [
  { label: 'Dashboard', labelKey: 'nav.dashboard', path: '/dashboard', icon: 'MdDashboard' },
  { label: 'Natural Language Search', labelKey: 'nav.search', path: '/search', icon: 'MdSearch' },
  { label: 'Search Results', labelKey: 'nav.searchResults', path: '/search/results', icon: 'MdViewModule' },
  { label: 'Cross-Camera Tracking', labelKey: 'nav.tracking', path: '/tracking', icon: 'MdTimeline' },
  { label: 'Camera Management', labelKey: 'nav.cameras', path: '/cameras', icon: 'MdVideocam' },
  { label: 'Ingest Video', labelKey: 'nav.ingest', path: '/ingest', icon: 'MdCloudUpload' },
  { label: 'Reports', labelKey: 'nav.reports', path: '/reports', icon: 'MdDescription' },
  { label: 'Audit Logs', labelKey: 'nav.auditLogs', path: '/audit-logs', icon: 'MdAssignmentTurnedIn' },
  { label: 'Settings', labelKey: 'nav.settings', path: '/settings', icon: 'MdSettings' },
]

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

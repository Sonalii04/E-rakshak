// Static mock data for UI development. Replace with live API responses once
// the FastAPI backend endpoints in src/services are pointed at a real host.

export const kpiData = [
  { id: 'cameras', label: 'Cameras Connected', value: 128, delta: '+4 today', tone: 'secondary', icon: 'MdVideocam' },
  { id: 'videos', label: 'Videos Indexed', value: 48210, delta: '+312 today', tone: 'accent', icon: 'MdPlayCircleOutline' },
  { id: 'searches', label: 'Active Searches', value: 7, delta: '2 pending review', tone: 'warning', icon: 'MdSearch' },
  { id: 'alerts', label: "Today's Alerts", value: 23, delta: '+6 vs yesterday', tone: 'danger', icon: 'MdNotificationsActive' },
  { id: 'persons', label: 'Total Persons Detected', value: 154302, delta: '+1,204 today', tone: 'secondary', icon: 'MdPeople' },
  { id: 'vehicles', label: 'Total Vehicles Detected', value: 98765, delta: '+842 today', tone: 'accent', icon: 'MdDirectionsCar' },
]

export const searchesPerDay = [
  { day: 'Mon', searches: 42 },
  { day: 'Tue', searches: 58 },
  { day: 'Wed', searches: 51 },
  { day: 'Thu', searches: 67 },
  { day: 'Fri', searches: 74 },
  { day: 'Sat', searches: 39 },
  { day: 'Sun', searches: 28 },
]

export const detectionStats = [
  { month: 'Feb', persons: 18200, vehicles: 11400 },
  { month: 'Mar', persons: 19800, vehicles: 12100 },
  { month: 'Apr', persons: 21200, vehicles: 13650 },
  { month: 'May', persons: 20400, vehicles: 14200 },
  { month: 'Jun', persons: 23100, vehicles: 15800 },
  { month: 'Jul', persons: 24600, vehicles: 16400 },
]

export const cameraActivity = [
  { hour: '00:00', activity: 12 },
  { hour: '04:00', activity: 8 },
  { hour: '08:00', activity: 46 },
  { hour: '12:00', activity: 63 },
  { hour: '16:00', activity: 71 },
  { hour: '20:00', activity: 54 },
]

export const objectDistribution = [
  { name: 'Persons', value: 154302, color: '#2563EB' },
  { name: 'Vehicles', value: 98765, color: '#22C55E' },
  { name: 'Bags', value: 12040, color: '#F59E0B' },
  { name: 'Others', value: 4310, color: '#94A3B8' },
]

export const recentSearches = [
  { id: 'SRCH-10231', query: 'Red hatchback near Railway Station between 8 PM and 10 PM', user: 'Insp. R. Sharma', date: '2026-07-07T09:12:00', matches: 14, status: 'Completed' },
  { id: 'SRCH-10230', query: 'Man wearing yellow shirt and black cap', user: 'SI. A. Verma', date: '2026-07-07T07:45:00', matches: 6, status: 'Completed' },
  { id: 'SRCH-10229', query: 'White SUV near City Mall parking', user: 'Insp. R. Sharma', date: '2026-07-06T22:03:00', matches: 21, status: 'Completed' },
  { id: 'SRCH-10228', query: 'Person carrying blue backpack after 11 PM', user: 'Const. P. Nair', date: '2026-07-06T19:30:00', matches: 3, status: 'Processing' },
  { id: 'SRCH-10227', query: 'Motorcycle with two riders, no helmets', user: 'SI. A. Verma', date: '2026-07-06T15:11:00', matches: 9, status: 'Completed' },
]

export const recentExports = [
  { id: 'RPT-4471', title: 'Railway Station Robbery Case #2291', format: 'PDF', date: '2026-07-07T08:20:00', user: 'Insp. R. Sharma', hash: '8f2a1c...9e0b4d' },
  { id: 'RPT-4470', title: 'Missing Person Search - Case #2288', format: 'ZIP', date: '2026-07-06T20:05:00', user: 'SI. A. Verma', hash: 'a13d90...77c2f1' },
  { id: 'RPT-4469', title: 'Traffic Violation Bundle - Sector 12', format: 'JSON', date: '2026-07-06T14:42:00', user: 'Const. P. Nair', hash: '5b6e2a...11f9aa' },
]

export const cameras = [
  { id: 'CAM-001', name: 'Railway Station Gate 1', location: 'Railway Station, Platform Rd', status: 'Online', lastActive: '2026-07-07T09:40:00', resolution: '4K (3840x2160)' },
  { id: 'CAM-002', name: 'City Mall Main Entrance', location: 'MG Road, City Mall', status: 'Online', lastActive: '2026-07-07T09:39:00', resolution: '1080p' },
  { id: 'CAM-003', name: 'Sector 12 Junction', location: 'Sector 12 Traffic Signal', status: 'Maintenance', lastActive: '2026-07-06T18:20:00', resolution: '1080p' },
  { id: 'CAM-004', name: 'Bus Stand North Gate', location: 'Central Bus Stand', status: 'Offline', lastActive: '2026-07-05T22:14:00', resolution: '720p' },
  { id: 'CAM-005', name: 'Riverside Bridge East', location: 'Riverside Road', status: 'Online', lastActive: '2026-07-07T09:41:00', resolution: '4K (3840x2160)' },
  { id: 'CAM-006', name: 'Market Square', location: 'Old Town Market', status: 'Online', lastActive: '2026-07-07T09:36:00', resolution: '1080p' },
  { id: 'CAM-007', name: 'Highway Toll Plaza', location: 'NH-48 Toll Plaza', status: 'Maintenance', lastActive: '2026-07-07T06:02:00', resolution: '4K (3840x2160)' },
  { id: 'CAM-008', name: 'Airport Road Checkpoint', location: 'Airport Approach Rd', status: 'Online', lastActive: '2026-07-07T09:38:00', resolution: '1080p' },
]

export const searchResults = [
  {
    id: 'RES-9001',
    snapshot: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&q=60',
    timestamp: '2026-07-07T20:14:00',
    cameraId: 'CAM-001',
    location: 'Railway Station, Platform Rd',
    confidence: 92,
    objectType: 'Vehicle',
    vehicleType: 'Hatchback',
    clothing: '-',
    color: 'Red',
  },
  {
    id: 'RES-9002',
    snapshot: 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&q=60',
    timestamp: '2026-07-07T20:32:00',
    cameraId: 'CAM-005',
    location: 'Riverside Road',
    confidence: 78,
    objectType: 'Vehicle',
    vehicleType: 'Hatchback',
    clothing: '-',
    color: 'Red',
  },
  {
    id: 'RES-9003',
    snapshot: 'https://images.unsplash.com/photo-1517840901100-8179e982acb7?w=400&q=60',
    timestamp: '2026-07-07T09:05:00',
    cameraId: 'CAM-002',
    location: 'MG Road, City Mall',
    confidence: 88,
    objectType: 'Person',
    vehicleType: '-',
    clothing: 'Yellow shirt, black cap',
    color: 'Yellow',
  },
  {
    id: 'RES-9004',
    snapshot: 'https://images.unsplash.com/photo-1544376798-6c0e1f6d8dfe?w=400&q=60',
    timestamp: '2026-07-06T18:50:00',
    cameraId: 'CAM-006',
    location: 'Old Town Market',
    confidence: 64,
    objectType: 'Person',
    vehicleType: '-',
    clothing: 'Yellow shirt',
    color: 'Yellow',
  },
  {
    id: 'RES-9005',
    snapshot: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=60',
    timestamp: '2026-07-06T21:10:00',
    cameraId: 'CAM-008',
    location: 'Airport Approach Rd',
    confidence: 95,
    objectType: 'Vehicle',
    vehicleType: 'SUV',
    clothing: '-',
    color: 'White',
  },
  {
    id: 'RES-9006',
    snapshot: 'https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?w=400&q=60',
    timestamp: '2026-07-05T17:22:00',
    cameraId: 'CAM-003',
    location: 'Sector 12 Traffic Signal',
    confidence: 71,
    objectType: 'Vehicle',
    vehicleType: 'SUV',
    clothing: '-',
    color: 'White',
  },
]

export const crossCameraTrail = [
  { id: 'TRK-1', camera: 'Railway Station Gate 1', timestamp: '2026-07-07T20:14:00', confidence: 92, preview: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=300&q=60', location: 'Platform Rd' },
  { id: 'TRK-2', camera: 'Market Square', timestamp: '2026-07-07T20:21:00', confidence: 84, preview: 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=300&q=60', location: 'Old Town Market' },
  { id: 'TRK-3', camera: 'Riverside Bridge East', timestamp: '2026-07-07T20:32:00', confidence: 78, preview: 'https://images.unsplash.com/photo-1544376798-6c0e1f6d8dfe?w=300&q=60', location: 'Riverside Road' },
  { id: 'TRK-4', camera: 'Highway Toll Plaza', timestamp: '2026-07-07T20:47:00', confidence: 69, preview: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=300&q=60', location: 'NH-48 Toll Plaza' },
]

export const reports = [
  {
    id: 'RPT-4471',
    title: 'Railway Station Robbery Case #2291',
    query: 'Red hatchback near Railway Station between 8 PM and 10 PM',
    cameras: ['CAM-001', 'CAM-005'],
    rangeStart: '2026-07-07T20:00:00',
    rangeEnd: '2026-07-07T22:00:00',
    matches: 14,
    hash: '8f2a1c53e9d47b0a6c1d2e3f4a5b6c7d9e0b4d',
    generatedBy: 'Insp. R. Sharma',
    generatedAt: '2026-07-07T22:15:00',
  },
]

export const auditLogs = [
  { id: 'AUD-7001', user: 'Insp. R. Sharma', time: '2026-07-07T09:12:00', action: 'Ran Search', query: 'Red hatchback near Railway Station 8-10 PM', exportStatus: '-' },
  { id: 'AUD-7000', user: 'SI. A. Verma', time: '2026-07-07T07:45:00', action: 'Ran Search', query: 'Man wearing yellow shirt and black cap', exportStatus: '-' },
  { id: 'AUD-6999', user: 'Insp. R. Sharma', time: '2026-07-07T08:20:00', action: 'Exported Report', query: 'Railway Station Robbery Case #2291', exportStatus: 'Success' },
  { id: 'AUD-6998', user: 'Const. P. Nair', time: '2026-07-06T19:30:00', action: 'Ran Search', query: 'Person carrying blue backpack after 11 PM', exportStatus: '-' },
  { id: 'AUD-6997', user: 'SI. A. Verma', time: '2026-07-06T20:05:00', action: 'Exported Report', query: 'Missing Person Search - Case #2288', exportStatus: 'Success' },
  { id: 'AUD-6996', user: 'Admin', time: '2026-07-06T09:00:00', action: 'Camera Status Update', query: 'CAM-004 marked Offline', exportStatus: '-' },
  { id: 'AUD-6995', user: 'Const. P. Nair', time: '2026-07-05T14:42:00', action: 'Export Failed', query: 'Traffic Violation Bundle - Sector 12', exportStatus: 'Failed' },
]

export const currentUser = {
  name: 'Inspector R. Sharma',
  username: 'r.sharma',
  badgeId: 'PD-22910',
  department: 'Cyber & Surveillance Cell',
  role: 'Investigating Officer',
  avatar: null,
}

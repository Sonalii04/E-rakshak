import api from './api'

export async function getDashboardData() {
  const res = await api.get('/dashboard')
  const { 
    overview, 
    alerts, 
    searches, 
    searchesPerDay, 
    detectionStats, 
    cameraActivity, 
    objectDistribution, 
    recentExports 
  } = res.data

  const kpis = [
    { id: 'cameras', label: 'Cameras Connected', value: overview.totalCameras, delta: '+0 today', tone: 'secondary', icon: 'MdVideocam' },
    { id: 'videos', label: 'Videos Indexed', value: overview.videosIndexed, delta: '+0 today', tone: 'accent', icon: 'MdPlayCircleOutline' },
    { id: 'searches', label: 'Active Searches', value: overview.activeSearches, delta: `${overview.processingQueue} in queue`, tone: 'warning', icon: 'MdSearch' },
    { id: 'alerts', label: "Today's Alerts", value: alerts.length, delta: `+${alerts.length} vs yesterday`, tone: 'danger', icon: 'MdNotificationsActive' },
    { id: 'persons', label: 'Total Persons Detected', value: Math.round(overview.objectsDetected * 0.6), delta: '+0 today', tone: 'secondary', icon: 'MdPeople' },
    { id: 'vehicles', label: 'Total Vehicles Detected', value: Math.round(overview.objectsDetected * 0.4), delta: '+0 today', tone: 'accent', icon: 'MdDirectionsCar' },
  ]

  const mappedSearches = (searches || []).map((s, idx) => ({
    id: s.operator || `SRCH-${1000 + idx}`,
    query: s.query,
    user: s.operator || 'SYSTEM',
    date: new Date().toISOString(),
    matches: s.status.includes('(') ? parseInt(s.status.match(/\d+/)?.[0] || '0') : 0,
    status: s.status.includes('Completed') ? 'Completed' : 'Processing'
  }))

  const mappedExports = (recentExports || []).map((e) => ({
    id: e.id,
    title: e.title,
    format: e.format,
    user: e.user,
    date: e.date
  }))

  return {
    kpis,
    searchesPerDay: searchesPerDay || [],
    detectionStats: detectionStats || [],
    cameraActivity: cameraActivity || [],
    objectDistribution: objectDistribution || [],
    recentSearches: mappedSearches,
    recentExports: mappedExports,
  }
}

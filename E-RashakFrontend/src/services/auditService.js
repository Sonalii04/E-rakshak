import api from './api'

export async function getAuditLogs() {
  const res = await api.get('/audit')
  return res.data.map(log => ({
    id: log.id,
    user: log.officer || 'SYSTEM',
    action: log.action,
    query: log.query || (log.details ? JSON.stringify(log.details) : ''),
    time: log.timestamp,
    exportStatus: log.details?.status || 'Success'
  }))
}

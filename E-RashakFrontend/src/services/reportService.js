import api from './api'

export async function getReports() {
  const res = await api.get('/report')
  return res.data
}

export async function generateReport(payload) {
  const res = await api.post('/report', payload)
  return res.data
}

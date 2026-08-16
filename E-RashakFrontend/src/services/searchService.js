import api from './api'

export async function runSearch(query, filters) {
  const res = await api.post('/search', { query, filters })
  const results = res.data.results || []
  return { query, filters, results, total: results.length }
}

export async function getResultById(id) {
  const res = await api.get(`/search/track/${id}`)
  return res.data
}

export async function getSearchHistory() {
  const res = await api.get('/search/history')
  return res.data
}

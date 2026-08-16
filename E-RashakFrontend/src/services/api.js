import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentryvision_token') || sessionStorage.getItem('sentryvision_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sentryvision_token')
      localStorage.removeItem('sentryvision_user')
      sessionStorage.removeItem('sentryvision_token')
      sessionStorage.removeItem('sentryvision_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Simulates network latency for dummy-data-backed calls so loading states
// are visible during UI development. Remove once real endpoints are wired.
export function mockResolve(payload, delay = 500) {
  return new Promise((resolve) => setTimeout(() => resolve(payload), delay))
}

export default api

import api from './api'
import { translateStatic } from '../i18n/translations'

export async function login(username, password) {
  if (!username || !password) {
    throw new Error(translateStatic('auth.missingCredentials'))
  }
  const res = await api.post('/auth/login', { username, password })
  if (res.data && res.data.token) {
    localStorage.setItem('sentryvision_token', res.data.token)
  }
  return res.data;
}

export async function register(username, password, role = 'OFFICER') {
  if (!username || !password) {
    throw new Error(translateStatic('auth.missingCredentials') || 'Username and password are required.')
  }
  const res = await api.post('/auth/register', { username, password, role })
  return res.data
}

export async function logout() {
  localStorage.removeItem('sentryvision_token')
  return { success: true }
}

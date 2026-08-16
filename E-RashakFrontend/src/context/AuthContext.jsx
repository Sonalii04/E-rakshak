import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('sentryvision_user') || sessionStorage.getItem('sentryvision_user')
    const token = localStorage.getItem('sentryvision_token') || sessionStorage.getItem('sentryvision_token')
    if (storedUser && storedUser !== 'undefined' && token && token !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Error parsing stored user data", e)
      }
    }
    setIsLoading(false)
  }, [])

  async function signIn(username, password, rememberMe) {
    const { token, user: loggedInUser } = await authService.login(username, password)
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('sentryvision_token', token)
    storage.setItem('sentryvision_user', JSON.stringify(loggedInUser))
    setUser(loggedInUser)
    return loggedInUser
  }

  async function signUp(username, password, role) {
    return await authService.register(username, password, role)
  }

  function signOut() {
    localStorage.removeItem('sentryvision_token')
    localStorage.removeItem('sentryvision_user')
    sessionStorage.removeItem('sentryvision_token')
    sessionStorage.removeItem('sentryvision_user')
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

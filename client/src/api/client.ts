import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
})

let accessToken: string | null = null
let refreshPromise: Promise<any> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem('refreshToken', token)
  } else {
    localStorage.removeItem('refreshToken')
  }
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken')
}

// Event for notifying auth state changes across the app
export const authEvents = {
  loggedOut: new Event('auth:logout'),
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const storedRefreshToken = getRefreshToken()
      if (!storedRefreshToken) {
        setAccessToken(null)
        setRefreshToken(null)
        return Promise.reject(error)
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken: storedRefreshToken })
        }

        const { data } = await refreshPromise
        refreshPromise = null

        setAccessToken(data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        refreshPromise = null
        setAccessToken(null)
        setRefreshToken(null)
        window.dispatchEvent(authEvents.loggedOut)
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

export default api

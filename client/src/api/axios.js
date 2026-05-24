import axios from 'axios'
import { API_URL } from '../constants'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url || ''

    // Don't redirect on the session-check call — AuthContext handles that silently
    const isSessionCheck = url.includes('/auth/me')

    if (status === 401 && !isSessionCheck) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

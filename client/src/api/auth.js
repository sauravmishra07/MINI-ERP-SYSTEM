import api from './axios'

// Email / password auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)

// Session
export const getMe = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')

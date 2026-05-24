import api from './axios'

export const getStats = () => api.get('/dashboard/stats')
export const getActivity = () => api.get('/dashboard/activity')

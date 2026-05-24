import api from './axios'
import { API_URL } from '../constants'
import { buildQueryString } from '../utils'

export const createRequest = (data) => api.post('/requests', data)

export const getRequests = (params = {}) =>
  api.get(`/requests?${buildQueryString(params)}`)

export const getRequest = (id) => api.get(`/requests/${id}`)

export const submitRequest = (id) => api.patch(`/requests/${id}/submit`)

export const approveRequest = (id, data = {}) =>
  api.patch(`/requests/${id}/approve`, data)

export const rejectRequest = (id, data = {}) =>
  api.patch(`/requests/${id}/reject`, data)

export const getExportUrl = (params = {}) => {
  const qs = buildQueryString(params)
  return `${API_URL}/api/v1/requests/export${qs ? `?${qs}` : ''}`
}

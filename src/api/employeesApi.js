import api from '../api'

export const listEmployees = (params) => api.get('/employees', { params })
export const getEmployee = (id) => api.get(`/employees/${id}`)
export const createEmployee = (data) => api.post('/employees', data)
export const updateEmployee = (id, data) => api.patch(`/employees/${id}`, data)
export const patchEmployeeStatus = (id, data) => api.patch(`/employees/${id}/status`, data)
export const deleteEmployee = (id) => api.delete(`/employees/${id}`)

export default {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  patchEmployeeStatus,
  deleteEmployee,
}

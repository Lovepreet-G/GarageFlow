import api from '../api'

export const getSchedules = (params) => api.get('/schedules', { params })
export const createSchedule = (data) => api.post('/schedules', data)
export const updateSchedule = (id, data) => api.put(`/schedules/${id}`, data)
export const deleteSchedule = (id) => api.delete(`/schedules/${id}`)

export default { getSchedules, createSchedule, updateSchedule, deleteSchedule }

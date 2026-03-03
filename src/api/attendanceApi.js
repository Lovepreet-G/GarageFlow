import api from '../api'

export const getAttendance = (params) => api.get('/attendance', { params })

export default { getAttendance }

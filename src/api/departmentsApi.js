import api from '../api'

export const listDepartments = () => api.get('/departments')
export const createDepartment = (data) => api.post('/departments', data)
export const deleteDepartment = (id) => api.delete(`/departments/${id}`)

export default { listDepartments, createDepartment, deleteDepartment }

import api from "../api"

const scheduleApi = {
  getSchedules: (params) => api.get("/schedules", { params }),
  createSchedule: (payload) => api.post("/schedules", payload),
  updateSchedule: (id, payload) => api.patch(`/schedules/${id}`, payload),
  deleteSchedule: (id) => api.delete(`/schedules/${id}`),
}

export default scheduleApi
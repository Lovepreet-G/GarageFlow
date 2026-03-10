import api from "../api"

const attendanceApi = {
  getAttendance: (params) => api.get("/attendance", { params }),
  updateAttendance: (id, payload) => api.patch(`/attendance/${id}`, payload),
}

export default attendanceApi
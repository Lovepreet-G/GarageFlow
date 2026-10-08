import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL

const adminApi = axios.create({
  baseURL: API_URL,
})

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      localStorage.removeItem("admin_token")
      localStorage.removeItem("admin_user")

      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login"
      }
    }

    return Promise.reject(error)
  }
)

export default {
  login(payload) {
    return adminApi.post("/admin/login", payload)
  },
  me() {
    return adminApi.get("/admin/me")
  },
  getStats() {
    return adminApi.get("/admin/stats")
  },
  getShops(params = {}) {
    return adminApi.get("/admin/shops", { params })
  },
  getLogs() {
    return adminApi.get("/admin/logs")
  },
  overridePlan(payload) {
    return adminApi.post("/admin/override-plan", payload)
  },
  setLifetime(payload) {
    return adminApi.post("/admin/set-lifetime", payload)
  },
  removeOverride(payload) {
    return adminApi.post("/admin/remove-override", payload)
  },
  removeLifetime(payload) {
    return adminApi.post("/admin/remove-lifetime", payload)
  },
}

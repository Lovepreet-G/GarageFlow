import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_URL,
})

// Attach token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

<<<<<<< HEAD
// ✅ Auto-logout on expired / invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status

    if (status === 401) {
      // clear auth
      localStorage.removeItem("token")
      localStorage.removeItem("shop") // if you store shop info

      // redirect to login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)

=======
>>>>>>> 1498db2 (fixed git error)
export default api

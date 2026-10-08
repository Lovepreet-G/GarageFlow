import { Navigate } from "react-router-dom"

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token")
  const shop = (() => {
    try {
      return JSON.parse(localStorage.getItem("shop") || "null")
    } catch {
      return null
    }
  })()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (shop?.access && !shop.access.can_access_app) {
    return <Navigate to="/pricing?upgrade=required" replace />
  }

  return children
}

export default ProtectedRoute

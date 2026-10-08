import { Navigate } from "react-router-dom"

function readShop() {
  try {
    return JSON.parse(localStorage.getItem("shop") || "null")
  } catch {
    return null
  }
}

export default function SubscriptionRoute({ children, requiredPlan = "starter" }) {
  const shop = readShop()
  const access = shop?.access

  if (!access) return children

  if (!access.can_access_app) {
    return <Navigate to="/pricing?upgrade=required" replace />
  }

  if (requiredPlan === "pro" && !access.pro_access) {
    return <Navigate to="/pricing?upgrade=pro" replace />
  }

  return children
}

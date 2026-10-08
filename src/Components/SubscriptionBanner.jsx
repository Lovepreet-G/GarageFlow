import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import subscriptionApi from "../api/subscriptionApi"

function readShop() {
  try {
    return JSON.parse(localStorage.getItem("shop") || "null")
  } catch {
    return null
  }
}

export default function SubscriptionBanner() {
  const navigate = useNavigate()
  const location = useLocation()
  const [shop, setShop] = useState(() => readShop())

  useEffect(() => {
    if (!localStorage.getItem("token")) return

    let active = true
    const load = async () => {
      try {
        const res = await subscriptionApi.getStatus()
        const currentShop = readShop() || {}
        const updated = {
          ...currentShop,
          subscription: res.data.subscription,
          access: res.data.access,
        }
        localStorage.setItem("shop", JSON.stringify(updated))
        if (active) setShop(updated)
      } catch (error) {
        console.error(error)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [location.pathname])

  const access = shop?.access
  const subscription = shop?.subscription

  if (!access || location.pathname === "/pricing") return null

  if (subscription?.status === "trialing" && access.trial_days_left > 0) {
    return (
      <div className="border-b border-cyan-100 bg-cyan-50 px-4 py-2 text-sm text-cyan-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            Your free Pro trial ends in <b>{access.trial_days_left}</b> day{access.trial_days_left === 1 ? "" : "s"}.
          </div>
          <button
            onClick={() => navigate("/pricing")}
            className="rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-cyan-100"
          >
            Manage Plan
          </button>
        </div>
      </div>
    )
  }

  if (!access.can_access_app || access.reason === "payment_required") {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>Your subscription needs attention before you can keep using GarageFlow.</div>
          <button
            onClick={() => navigate("/pricing")}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-amber-100"
          >
            Update Billing
          </button>
        </div>
      </div>
    )
  }

  if (subscription?.plan === "starter") {
    return (
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>You are on the Starter plan. Upgrade to Pro for employees, scheduling, attendance, and payroll.</div>
          <button
            onClick={() => navigate("/pricing?upgrade=pro")}
            className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-100"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    )
  }

  return null
}

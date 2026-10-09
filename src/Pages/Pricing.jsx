import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import MarketingShell from "../Components/MarketingShell"
import subscriptionApi from "../api/subscriptionApi"

function readShop() {
  try {
    return JSON.parse(localStorage.getItem("shop") || "null")
  } catch {
    return null
  }
}

const plans = [
  {
    id: "starter",
    title: "Starter",
    price: "$19",
    subtitle: "For shops focused on service records and invoicing.",
    features: ["Invoices", "Customers"],
  },
  {
    id: "pro",
    title: "Pro",
    price: "$49",
    subtitle: "For shops that want the full operations system.",
    features: ["Everything in Starter", "Employee Management", "Scheduling", "Attendance", "Payroll"],
    highlight: true,
  },
]

export default function Pricing() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])

  const [shop, setShop] = useState(() => readShop())
  const [loadingPlan, setLoadingPlan] = useState("")
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [error, setError] = useState("")
  const [statusLoading, setStatusLoading] = useState(false)

  const token = localStorage.getItem("token")
  const subscription = shop?.subscription
  const access = shop?.access

  useEffect(() => {
    if (!token) return

    let active = true
    const load = async () => {
      setStatusLoading(true)
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
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setStatusLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [token])

  const startTrial = async (plan) => {
    if (!token) {
      navigate("/register")
      return
    }

    try {
      setError("")
      setLoadingPlan(plan)
      const res = await subscriptionApi.createCheckoutSession(plan)
      window.location.href = res.data.url
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || "Failed to start checkout.")
    } finally {
      setLoadingPlan("")
    }
  }

  const openBillingPortal = async () => {
    try {
      setError("")
      setLoadingPortal(true)
      const res = await subscriptionApi.createPortalSession()
      window.location.href = res.data.url
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || "Failed to open billing portal.")
    } finally {
      setLoadingPortal(false)
    }
  }

  const upgradeState = params.get("upgrade")
  const checkoutState = params.get("checkout")

  useEffect(() => {
    if (!token || checkoutState !== "success") return

    let active = true
    let attempt = 0
    let timeout

    const refreshSubscription = async () => {
      try {
        const { data } = await subscriptionApi.getStatus()
        const currentShop = readShop() || {}
        const updated = {
          ...currentShop,
          subscription: data.subscription,
          access: data.access,
        }
        localStorage.setItem("shop", JSON.stringify(updated))
        if (active) setShop(updated)

        const synchronized =
          data.access?.can_access_app &&
          (data.subscription?.stripe_subscription_id ||
            data.subscription?.is_lifetime ||
            data.subscription?.is_overridden)
        if (synchronized) return
      } catch (error) {
        console.error(error)
      }

      attempt += 1
      if (active && attempt < 12) {
        timeout = window.setTimeout(refreshSubscription, 2500)
      }
    }

    timeout = window.setTimeout(refreshSubscription, 1500)
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [checkoutState, token])

  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            Pricing
          </div>
          <h1 className="mt-4 text-4xl font-extrabold italic tracking-tight sm:text-5xl">
            Simple monthly pricing with a <span className="text-sky-500">30-day free trial</span>.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            No credit card is required to start the trial. Every new shop can access full Pro features
            during the 30-day trial window, then continue on the plan that fits best.
          </p>
        </div>

        {upgradeState === "required" ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Your subscription needs to be activated before you can continue using GarageFlow.
          </div>
        ) : null}

        {upgradeState === "pro" ? (
          <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
            This feature is part of the Pro plan.
          </div>
        ) : null}

        {checkoutState === "success" ? (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Your Stripe checkout is complete. Your subscription status will refresh automatically.
          </div>
        ) : null}

        {checkoutState === "canceled" ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Checkout was canceled. You can restart it any time.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {token ? (
          <div className="mt-8 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-lg font-extrabold italic text-slate-900">Current Subscription</div>
                <div className="mt-2 text-sm text-slate-600">
                  {statusLoading
                    ? "Loading subscription status..."
                    : subscription
                      ? `${subscription.plan?.toUpperCase() || "PLAN"} | ${subscription.status?.toUpperCase() || "UNKNOWN"}`
                      : "No subscription data found yet."}
                </div>
                {access?.trial_days_left ? (
                  <div className="mt-2 text-sm text-cyan-700">
                    Trial days left: <b>{access.trial_days_left}</b>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={openBillingPortal}
                  disabled={loadingPortal || !subscription?.stripe_subscription_id}
                  className="rounded-2xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingPortal ? "Opening..." : "Manage Billing"}
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Back to Dashboard
                </button>
              </div>
              {!subscription?.stripe_subscription_id && !subscription?.is_lifetime ? (
                <div className="mt-3 text-xs text-slate-500">
                  Choose a plan below to activate billing and start your trial.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={[
                "rounded-[30px] border p-6 shadow-sm",
                plan.highlight ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-2xl font-extrabold italic">{plan.title}</div>
                  <div className={["mt-3 text-sm leading-6", plan.highlight ? "text-white/75" : "text-slate-500"].join(" ")}>
                    {plan.subtitle}
                  </div>
                </div>
                {plan.highlight ? (
                  <div className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-900">
                    Most Popular
                  </div>
                ) : null}
              </div>

              <div className="mt-6 text-5xl font-extrabold italic">
                {plan.price}
                <span className="ml-2 text-base font-semibold">/ month</span>
              </div>

              <div className={["mt-6 space-y-3 text-sm", plan.highlight ? "text-white/85" : "text-slate-600"].join(" ")}>
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <span className={plan.highlight ? "text-cyan-300" : "text-cyan-600"}>•</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button
                  onClick={() => startTrial(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={[
                    "w-full rounded-2xl px-5 py-3 text-sm font-semibold transition",
                    plan.highlight
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800",
                    loadingPlan === plan.id ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  {loadingPlan === plan.id ? "Starting..." : "Start Free Trial"}
                </button>

                <div className={["mt-3 text-xs", plan.highlight ? "text-white/60" : "text-slate-400"].join(" ")}>
                  30-day free trial. No credit card required during signup.
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  )
}

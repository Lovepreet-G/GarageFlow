import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"

import adminApi from "../api/adminApi"

export default function AdminLogin() {
  const navigate = useNavigate()
  const existingToken = localStorage.getItem("admin_token")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  if (existingToken) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Email and password are required.")
      return
    }

    try {
      setLoading(true)
      const res = await adminApi.login({
        email: email.trim().toLowerCase(),
        password,
      })

      localStorage.setItem("admin_token", res.data.admin_token)
      localStorage.setItem("admin_user", JSON.stringify(res.data.admin))
      navigate("/admin", { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sign in as admin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl">
        <div className="hidden w-1/2 border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),_transparent_45%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              GarageFlow Admin
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight">
              Full control over shops, trials, billing, and access.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
              This console is isolated from the normal shop dashboard and is only for super admin
              subscription management.
            </p>
          </div>

          {/* <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            <div className="font-semibold text-white">Security</div>
            <div className="mt-2 leading-6">
              Separate JWTs, separate routes, admin-only middleware, and a full audit trail for
              subscription overrides and lifetime access.
            </div>
          </div> */}
        </div>

        <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-md">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Super Admin
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              Sign in to the admin panel
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use your admin credentials only. Normal shop accounts cannot access this area.
            </p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Admin email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white"
                  placeholder="admin@garageflow.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 outline-none transition focus:border-slate-400 focus:bg-white"
                    placeholder="Enter admin password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Open Admin Panel"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

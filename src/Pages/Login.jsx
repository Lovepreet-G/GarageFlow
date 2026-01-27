import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"
import logoHalf from "../assets/logo_half.png"

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ shop_email: "", password: "" })
  const [errors, setErrors] = useState({ shop_email: "", password: "", general: "" })
  const [loading, setLoading] = useState(false)

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false)
  const [fpEmail, setFpEmail] = useState("")
  const [fpError, setFpError] = useState("")
  const [fpMsg, setFpMsg] = useState("")
  const [fpLoading, setFpLoading] = useState(false)

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }))
  }

  const validate = () => {
    const e = { shop_email: "", password: "", general: "" }

    if (!form.shop_email.trim()) e.shop_email = "Email is required."
    else if (!isValidEmail(form.shop_email.trim())) e.shop_email = "Enter a valid email address."

    if (!form.password) e.password = "Password is required."
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters."

    setErrors(e)
    return !e.shop_email && !e.password
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await api.post("/auth/login", {
        shop_email: form.shop_email.trim(),
        password: form.password,
      })

      localStorage.setItem("token", res.data.token)
      localStorage.setItem("shop", JSON.stringify(res.data.shop))
      navigate("/dashboard")
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please try again."

      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("credential") ||
        msg.toLowerCase().includes("password") ||
        err.response?.status === 401
      ) {
        setErrors((prev) => ({ ...prev, password: msg, general: "" }))
      } else {
        setErrors((prev) => ({ ...prev, general: msg }))
      }
    } finally {
      setLoading(false)
    }
  }

  const openForgot = () => {
    setShowForgot(true)
    setFpEmail(form.shop_email.trim() || "")
    setFpError("")
    setFpMsg("")
  }

  const closeForgot = () => {
    setShowForgot(false)
    setFpError("")
    setFpMsg("")
    setFpLoading(false)
  }

  const submitForgot = async (e) => {
    e.preventDefault()
    setFpError("")
    setFpMsg("")

    const email = fpEmail.trim()
    if (!email) return setFpError("Email is required.")
    if (!isValidEmail(email)) return setFpError("Enter a valid email address.")

    setFpLoading(true)
    try {
      const res = await api.post("/auth/forgot-password", { shop_email: email })
      setFpMsg(res.data?.message || "If the email exists, a reset link has been sent.")
    } catch (err) {
      // Don’t reveal whether email exists
      setFpMsg(err.response?.data?.message || "If the email exists, a reset link has been sent.")
    } finally {
      setFpLoading(false)
    }
  }

  // small helper for nice input style
  const inputBase =
    "w-full rounded-xl bg-slate-100/80 border border-transparent px-4 py-3 pl-11 " +
    "text-slate-900 placeholder:text-slate-400 outline-none " +
    "focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-200 transition"

  const emailBorder = errors.shop_email ? "border-red-500 bg-red-50 focus:ring-red-100" : ""
  const passBorder = errors.password ? "border-red-500 bg-red-50 focus:ring-red-100" : ""

  const year = useMemo(() => new Date().getFullYear(), [])

  return (
    
    <div className="min-h-screen bg-slate-50">
      <div className="min-h-screen w-screen grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT BRAND PANEL */}
        <div className="relative overflow-hidden">
          {/* background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900" />

          {/* subtle grid */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), " +
                "linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              maskImage: "radial-gradient(circle at 30% 30%, black 50%, transparent 80%)",
            }}
          />

          {/* content */}
          <div className="relative h-full px-6 py-12 lg:px-12 flex items-center justify-center">
            <div className="w-full max-w-lg text-center lg:text-left">
              {/* Logo row */}
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="h-14 w-14 rounded-2xl bg-white/100 border border-white/15 flex items-center justify-center">
                  <img src={logoHalf} alt="GarageFlow" className="h-12 w-12 object-contain"/>
                </div>

                <div className="text-white">
                  <div className="text-2xl font-extrabold tracking-wide">GARAGEFLOW</div>
                  <div className="text-xs text-white/70">Invoice & Repair Management</div>
                </div>
              </div>

              <div className="mt-10">
                <div className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Pulsing through every{" "}
                  <span className="text-cyan-300 italic">Garage.</span>
                </div>
                <div className="mt-4 text-sm sm:text-base text-white/70 max-w-md mx-auto lg:mx-0">
                  Streamlining maintenance with precision. Track customers, vehicles, invoices,
                  and stay on top of unpaid bills — all in one place.
                </div>
              </div>

              <div className="mt-10 text-xs text-white/50">
                © {year} GarageFlow • All rights reserved
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="flex items-center justify-center px-4 py-10 lg:py-0">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
              <div className="mb-6">
                <div className="text-3xl font-extrabold text-slate-900">Sign In</div>
                <div className="text-sm text-slate-500 mt-1">
                  Access your GarageFlow dashboard
                </div>
              </div>

              {errors.general ? (
                <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {errors.general}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <div className="text-xs tracking-widest text-slate-400 font-semibold mb-2">
                    SHOP EMAIL
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {/* mail icon */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 6h16v12H4V6Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        <path
                          d="m4 7 8 6 8-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <input
                      type="email"
                      className={[inputBase, emailBorder].join(" ")}
                      value={form.shop_email}
                      onChange={(e) => setField("shop_email", e.target.value)}
                      placeholder="shop@garageflow.com"
                      autoComplete="email"
                    />
                  </div>

                  {errors.shop_email ? (
                    <div className="mt-2 text-sm text-red-600">{errors.shop_email}</div>
                  ) : null}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs tracking-widest text-slate-400 font-semibold">
                      SECURITY CODE
                    </div>
                    <button
                      type="button"
                      onClick={openForgot}
                      className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 hover:underline"
                    >
                      RECOVERY?
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {/* lock icon */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M7 11V8a5 5 0 0 1 10 0v3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6 11h12v10H6V11Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>

                    <input
                      type="password"
                      className={[inputBase, passBorder].join(" ")}
                      value={form.password}
                      onChange={(e) => setField("password", e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>

                  {errors.password ? (
                    <div className="mt-2 text-sm text-red-600">{errors.password}</div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    "w-full rounded-2xl py-3 font-semibold text-white shadow-lg",
                    "transition active:scale-[0.99]",
                    loading
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-indigo-950 hover:bg-indigo-900",
                  ].join(" ")}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {loading ? "Signing in..." : "GO TO DASHBOARD"}
                    <span aria-hidden>→</span>
                  </span>
                </button>
              </form>

              <div className="mt-6 pt-5 border-t text-center text-sm">
                <span className="text-slate-500">NO ACCOUNT?</span>{" "}
                <Link to="/register" className="font-semibold text-cyan-700 hover:underline">
                  START FLOWING
                </Link>
              </div>
            </div>

            {/* small footer */}
            <div className="text-center text-xs text-slate-400 mt-4">
              Powered by GarageFlow
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot ? (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold">Reset your password</div>
                <div className="text-sm text-slate-600 mt-1">
                  Enter your shop email. We'll send a reset link if it exists.
                </div>
              </div>

              <button
                type="button"
                onClick={closeForgot}
                className="px-2 py-1 rounded hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitForgot} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={fpEmail}
                  onChange={(e) => {
                    setFpEmail(e.target.value)
                    setFpError("")
                    setFpMsg("")
                  }}
                  className={[
                    "w-full border rounded-xl px-3 py-2",
                    fpError ? "border-red-500" : "border-slate-300",
                  ].join(" ")}
                  placeholder="shop@example.com"
                  autoComplete="email"
                />
                {fpError ? <div className="mt-1 text-sm text-red-600">{fpError}</div> : null}
              </div>

              {fpMsg ? (
                <div className="text-sm text-green-700 bg-green-50 border rounded px-3 py-2">
                  {fpMsg}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeForgot}
                  className="px-4 py-2 rounded border hover:bg-slate-50"
                  disabled={fpLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fpLoading}
                  className={[
                    "px-4 py-2 rounded text-white font-semibold",
                    fpLoading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
                  ].join(" ")}
                >
                  {fpLoading ? "Sending..." : "Send link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Login

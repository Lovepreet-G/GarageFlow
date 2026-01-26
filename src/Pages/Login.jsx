import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    shop_email: "",
    password: "",
  })

  const [errors, setErrors] = useState({
    shop_email: "",
    password: "",
    general: "",
  })

  const [loading, setLoading] = useState(false)

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false)
  const [fpEmail, setFpEmail] = useState("")
  const [fpError, setFpError] = useState("")
  const [fpMsg, setFpMsg] = useState("")
  const [fpLink, setFpLink] = useState("")
  const [fpLoading, setFpLoading] = useState(false)

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }))
  }

  const validate = () => {
    const e = { shop_email: "", password: "", general: "" }

    if (!form.shop_email.trim()) e.shop_email = "Email is required."
    else if (!isValidEmail(form.shop_email.trim()))
      e.shop_email = "Enter a valid email address."

    if (!form.password) e.password = "Password is required."
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters."

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

      navigate("/")
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
    setFpLink("")
  }

  const closeForgot = () => {
    setShowForgot(false)
    setFpError("")
    setFpMsg("")
    setFpLink("")
    setFpLoading(false)
  }

  const submitForgot = async (e) => {
    e.preventDefault()
    setFpError("")
    setFpMsg("")
    setFpLink("")

    const email = fpEmail.trim()
    if (!email) return setFpError("Email is required.")
    if (!isValidEmail(email)) return setFpError("Enter a valid email address.")

    setFpLoading(true)
    try {
      const res = await api.post("/auth/forgot-password", { shop_email: email })
      setFpMsg(res.data?.message || "If the email exists, a reset link has been sent.")
      // dev-only helper: show link if backend returns it
      if (res.data?.reset_link) setFpLink(res.data.reset_link)
    } catch (err) {
      // We still don’t want to reveal if email exists.
      // But if server returns a message (like rate limit), show it.
      setFpMsg(err.response?.data?.message || "If the email exists, a reset link has been sent.")
    } finally {
      setFpLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6">
        {/* Top brand */}
        <div className="text-center mb-6">
          <div className="text-2xl font-bold">GarageFlow</div>
          <div className="text-sm text-slate-500">Sign in to your shop</div>
        </div>

        {/* General error */}
        {errors.general ? (
          <div className="mb-4 text-sm text-red-600">{errors.general}</div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className={[
                "w-full border rounded px-3 py-2",
                errors.shop_email ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              value={form.shop_email}
              onChange={(e) => setField("shop_email", e.target.value)}
              placeholder="shop@example.com"
              autoComplete="email"
            />
            {errors.shop_email ? (
              <div className="mt-1 text-sm text-red-600">{errors.shop_email}</div>
            ) : null}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className={[
                "w-full border rounded px-3 py-2",
                errors.password ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password ? (
              <div className="mt-1 text-sm text-red-600">{errors.password}</div>
            ) : null}

            {/* Forgot password link */}
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={openForgot}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={[
              "w-full py-2 rounded font-semibold text-white",
              loading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
            ].join(" ")}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="text-sm text-center mt-5">
          <span className="text-slate-600">Don't have an account?</span>{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Create an account
          </Link>
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
                  Enter your shop email. We’ll send a reset link if it exists.
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
                    setFpLink("")
                  }}
                  className={[
                    "w-full border rounded px-3 py-2",
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

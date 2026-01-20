import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"

function isValidEmail(email) {
  // simple, practical validation
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

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    // clear related errors while typing
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

      // expected response: { token, shop }
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("shop", JSON.stringify(res.data.shop))

      navigate("/")
    } catch (err) {
      const msg =
        err.response?.data?.message || "Login failed. Please try again."

      // show invalid credentials under password (nice UX)
      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("credential") ||
        msg.toLowerCase().includes("password") ||
        err.response?.status === 401
      ) {
        setErrors((prev) => ({
          ...prev,
          password: msg,
          general: "",
        }))
      } else {
        setErrors((prev) => ({
          ...prev,
          general: msg,
        }))
      }
    } finally {
      setLoading(false)
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
    </div>
  )
}

export default Login

import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import api from "../api"

function isStrongEnough(pw) {
  if (!pw) return "Password is required."
  if (pw.length < 8) return "Password must be at least 8 characters."
  return ""
}

function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()

  const [token, setToken] = useState("")
  const [form, setForm] = useState({ new_password: "", confirm_password: "" })
  const [showSuccess, setShowSuccess] = useState(false)

  const [errors, setErrors] = useState({
    token: "",
    new_password: "",
    confirm_password: "",
    general: "",
  })

  const [loading, setLoading] = useState(false)
  const [doneMsg, setDoneMsg] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get("token") || ""
    setToken(t)
    if (!t) {
      setErrors((p) => ({ ...p, token: "Reset token is missing. Please request a new link." }))
    }
  }, [location.search])

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }))
    setErrors((p) => ({ ...p, [name]: "", general: "" }))
    setDoneMsg("")
  }

  const validate = () => {
    const e = { token: "", new_password: "", confirm_password: "", general: "" }

    if (!token) e.token = "Reset token is missing. Please request a new link."
    e.new_password = isStrongEnough(form.new_password)

    if (!form.confirm_password) e.confirm_password = "Confirm password is required."
    else if (form.confirm_password !== form.new_password)
      e.confirm_password = "Passwords do not match."

    setErrors(e)
    return !e.token && !e.new_password && !e.confirm_password
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors((p) => ({ ...p, general: "" }))
    try {
      const res = await api.post("/auth/reset-password", {
        token,
        new_password: form.new_password,
      })

      setDoneMsg(res.data?.message || "Password updated successfully.")
      // redirect to login after a short moment
        setShowSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || "Reset failed. Please request a new link."
      // token errors show at top
      if (msg.toLowerCase().includes("token") || msg.toLowerCase().includes("expired")) {
        setErrors((p) => ({ ...p, token: msg }))
      } else {
        setErrors((p) => ({ ...p, general: msg }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
  <>
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold">GarageFlow</div>
          <div className="text-sm text-slate-500">Reset your password</div>
        </div>

        {errors.general && (
          <div className="mb-4 text-sm text-red-600 text-center">
            {errors.general}
          </div>
        )}

        {doneMsg && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border rounded px-3 py-2 text-center">
            {doneMsg}
          </div>
        )}

        {errors.token && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border rounded px-3 py-2 text-center">
            {errors.token}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              New Password
            </label>
            <input
              type="password"
              value={form.new_password}
              onChange={(e) => setField("new_password", e.target.value)}
              className={`w-full border rounded px-3 py-2 ${
                errors.new_password ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={!token || loading}
            />
            {errors.new_password ? (
              <div className="mt-1 text-sm text-red-600">
                {errors.new_password}
              </div>
            ) : (
              <div className="mt-1 text-xs text-slate-500">
                Minimum 8 characters
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={form.confirm_password}
              onChange={(e) => setField("confirm_password", e.target.value)}
              className={`w-full border rounded px-3 py-2 ${
                errors.confirm_password ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={!token || loading}
            />
            {errors.confirm_password && (
              <div className="mt-1 text-sm text-red-600">
                {errors.confirm_password}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className={`w-full py-2 rounded font-semibold text-white ${
              loading || !token
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="text-sm text-center mt-5">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>

    {/* Success Modal */}
    {showSuccess && (
      <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center px-4">
        <div className="bg-white w-full max-w-sm rounded-2xl border p-6 text-center">
          <div className="text-lg font-bold mb-2">
            Password Updated
          </div>
          <div className="text-sm text-slate-600">
            Your password has been updated successfully.
            <br />
            Please log in with your new password.
          </div>

          <button
            onClick={() => navigate("/login")}
            className="mt-5 px-6 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
          >
            OK
          </button>
        </div>
      </div>
    )}
  </>
)
}

export default ResetPassword

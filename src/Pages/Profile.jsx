import { useMemo, useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"

function Profile() {
  const navigate = useNavigate()

  const shop = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("shop") || "null")
    } catch {
      return null
    }
  }, [])

  const API_BASE = import.meta.env.VITE_API_URL || ""

  const currentLogo = shop?.logo_url
    ? shop.logo_url.startsWith("http")
      ? shop.logo_url
      : `${API_BASE}${shop.logo_url}`
    : null

  // ---------------- LOGO ----------------
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [logoError, setLogoError] = useState("")
  const [logoSuccess, setLogoSuccess] = useState("")
  const [savingLogo, setSavingLogo] = useState(false)

  const onPick = (f) => {
    setLogoError("")
    setLogoSuccess("")

    if (!f) {
      setFile(null)
      setPreview("")
      return
    }

    if (!f.type.startsWith("image/")) {
      setLogoError("Please choose an image file.")
      return
    }

    if (f.size > 2 * 1024 * 1024) {
      setLogoError("Max logo size is 2MB.")
      return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const saveLogo = async () => {
    setLogoError("")
    setLogoSuccess("")
    if (!file) {
      setLogoError("Please select a logo file.")
      return
    }

    setSavingLogo(true)
    try {
      const fd = new FormData()
      fd.append("logo", file)

      const res = await api.patch("/shops/me/logo", fd)
      const newLogoUrl = res.data.logo_url

      const current = JSON.parse(localStorage.getItem("shop") || "{}")
      const updated = { ...current, logo_url: newLogoUrl }
      localStorage.setItem("shop", JSON.stringify(updated))

      setLogoSuccess("Logo updated successfully.")
      setFile(null)
      setPreview("")
    } catch (err) {
      setLogoError(err.response?.data?.message || "Failed to update logo.")
    } finally {
      setSavingLogo(false)
    }
  }

  // ---------------- PASSWORD ----------------
  const [pw, setPw] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  const [pwErrors, setPwErrors] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
    general: "",
  })

  const [savingPw, setSavingPw] = useState(false)
  const [showPwSuccess, setShowPwSuccess] = useState(false)

  const setPwField = (name, value) => {
    setPw((p) => ({ ...p, [name]: value }))
    setPwErrors((p) => ({ ...p, [name]: "", general: "" }))
  }

  const validatePw = () => {
    const e = { current_password: "", new_password: "", confirm_password: "", general: "" }

    if (!pw.current_password) e.current_password = "Current password is required."
    if (!pw.new_password) e.new_password = "New password is required."
    else if (pw.new_password.length < 8) e.new_password = "Password must be at least 8 characters."

    if (!pw.confirm_password) e.confirm_password = "Confirm password is required."
    else if (pw.confirm_password !== pw.new_password) e.confirm_password = "Passwords do not match."

    setPwErrors(e)
    return !e.current_password && !e.new_password && !e.confirm_password
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (!validatePw()) return

    setSavingPw(true)
    setPwErrors((p) => ({ ...p, general: "" }))

    try {
      await api.patch("/shops/me/password", {
        current_password: pw.current_password,
        new_password: pw.new_password,
      })

      setPw({ current_password: "", new_password: "", confirm_password: "" })
      setShowPwSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password."

      // Put common messages under correct field
      if (msg.toLowerCase().includes("current password")) {
        setPwErrors((p) => ({ ...p, current_password: msg }))
      } else if (msg.toLowerCase().includes("at least")) {
        setPwErrors((p) => ({ ...p, new_password: msg }))
      } else {
        setPwErrors((p) => ({ ...p, general: msg }))
      }
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header (matches your big-title vibe) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold italic tracking-tight leading-none">
            <span className="text-slate-900">SHOP</span>{" "}
            <span className="text-sky-500">PROFILE</span>
          </h1>
          <div className="mt-1 text-[11px] sm:text-xs uppercase tracking-[0.18em] text-slate-500">
            Security & identity protocol
          </div>
        </div>

        {/* optional space for future actions */}
        <div className="hidden sm:block text-xs text-slate-500">
          {shop?.shop_name ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
              {shop.shop_name}
            </span>
          ) : null}
        </div>
      </div>

      {/* Responsive two-column layout (stacks on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LOGO CARD */}
        <div className="bg-white border rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="text-sm font-extrabold italic tracking-tight">
            <span className="text-slate-900">IDENTITY</span>{" "}
            <span className="text-sky-500">BRANDING</span>
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Visual identifier profile
          </div>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-28 h-28 sm:w-32 sm:h-32 border rounded-2xl flex items-center justify-center overflow-hidden bg-slate-50">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              ) : currentLogo ? (
                <img src={currentLogo} alt="Shop Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="text-xs text-slate-400">NO LOGO SET</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-base font-bold italic text-slate-900 truncate">
                {(shop?.shop_name || "SAMPLE SHOP").toUpperCase()}
              </div>
              <div className="mt-1 text-xs text-slate-500">PNG/JPG/WebP, max 2MB</div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Upload logo
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => onPick(e.target.files?.[0])}
                  className="block w-full text-sm file:mr-3 file:rounded-xl file:border file:border-slate-200 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-slate-50"
                />
              </div>
            </div>
          </div>

          {logoError ? (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              {logoError}
            </div>
          ) : null}
          {logoSuccess ? (
            <div className="mt-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
              {logoSuccess}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFile(null)
                setPreview("")
                setLogoError("")
                setLogoSuccess("")
              }}
              className="px-4 py-2 rounded-2xl border bg-white hover:bg-slate-50"
              disabled={savingLogo}
            >
              RESET
            </button>

            <button
              type="button"
              onClick={saveLogo}
              disabled={savingLogo || !file}
              className={[
                "px-4 py-2 rounded-2xl text-white font-semibold shadow-sm",
                savingLogo || !file
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800",
              ].join(" ")}
            >
              {savingLogo ? "UPDATING..." : "UPDATE BRAND"}
            </button>
          </div>
        </div>

        {/* PASSWORD CARD */}
        <div className="bg-white border rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="text-sm font-extrabold italic tracking-tight">
            <span className="text-slate-900">SECURITY</span>{" "}
            <span className="text-sky-500">VAULT</span>
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Access sequence management
          </div>

          {pwErrors.general ? (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              {pwErrors.general}
            </div>
          ) : null}

          <form onSubmit={savePassword} className="mt-5 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={pw.current_password}
                onChange={(e) => setPwField("current_password", e.target.value)}
                className={[
                  "w-full border rounded-2xl px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2",
                  pwErrors.current_password
                    ? "border-red-300 focus:ring-red-200"
                    : "border-slate-200 focus:ring-slate-200",
                ].join(" ")}
                autoComplete="current-password"
              />
              {pwErrors.current_password ? (
                <div className="mt-2 text-sm text-red-600">{pwErrors.current_password}</div>
              ) : null}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                value={pw.new_password}
                onChange={(e) => setPwField("new_password", e.target.value)}
                className={[
                  "w-full border rounded-2xl px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2",
                  pwErrors.new_password
                    ? "border-red-300 focus:ring-red-200"
                    : "border-slate-200 focus:ring-slate-200",
                ].join(" ")}
                autoComplete="new-password"
              />
              {pwErrors.new_password ? (
                <div className="mt-2 text-sm text-red-600">{pwErrors.new_password}</div>
              ) : (
                <div className="mt-2 text-xs text-slate-500">Minimum 8 characters.</div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={pw.confirm_password}
                onChange={(e) => setPwField("confirm_password", e.target.value)}
                className={[
                  "w-full border rounded-2xl px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2",
                  pwErrors.confirm_password
                    ? "border-red-300 focus:ring-red-200"
                    : "border-slate-200 focus:ring-slate-200",
                ].join(" ")}
                autoComplete="new-password"
              />
              {pwErrors.confirm_password ? (
                <div className="mt-2 text-sm text-red-600">{pwErrors.confirm_password}</div>
              ) : null}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPw}
                className={[
                  "px-6 py-3 rounded-2xl text-white font-semibold shadow-sm w-full sm:w-auto",
                  savingPw ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
                ].join(" ")}
              >
                {savingPw ? "RE-KEYING..." : "RE-KEY VAULT"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showPwSuccess ? (
        <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-sm rounded-3xl border p-6 text-center shadow-lg">
            <div className="text-lg font-extrabold mb-2">Password Updated</div>
            <div className="text-sm text-slate-600">
              Your password has been updated successfully.
            </div>

            <button
              onClick={() => setShowPwSuccess(false)}
              className="mt-5 px-6 py-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 w-full"
            >
              OK
            </button>

            {/* Optional: log out after password change
            <button
              onClick={() => {
                localStorage.removeItem("token")
                localStorage.removeItem("shop")
                navigate("/login")
              }}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Log out now
            </button>
            */}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Profile

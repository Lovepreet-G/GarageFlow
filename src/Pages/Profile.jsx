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
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* LOGO CARD */}
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div className="text-lg font-semibold">Shop Logo</div>

        <div className="flex items-center gap-4">
          <div className="w-28 h-28 border rounded-lg flex items-center justify-center overflow-hidden bg-white">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            ) : currentLogo ? (
              <img src={currentLogo} alt="Shop Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="text-xs text-slate-400">No Logo</div>
            )}
          </div>

          <div className="flex-1">
            <div className="text-sm font-medium">{shop?.shop_name || "Shop"}</div>
            <div className="text-xs text-slate-500">PNG/JPG/WebP, max 2MB</div>
          </div>
        </div>

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => onPick(e.target.files?.[0])}
          className="block w-full text-sm"
        />

        {logoError ? <div className="text-sm text-red-600">{logoError}</div> : null}
        {logoSuccess ? <div className="text-sm text-green-700">{logoSuccess}</div> : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setFile(null)
              setPreview("")
              setLogoError("")
              setLogoSuccess("")
            }}
            className="px-4 py-2 rounded border hover:bg-slate-50"
            disabled={savingLogo}
          >
            Reset
          </button>

          <button
            type="button"
            onClick={saveLogo}
            disabled={savingLogo || !file}
            className={[
              "px-4 py-2 rounded text-white font-semibold",
              savingLogo || !file ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
            ].join(" ")}
          >
            {savingLogo ? "Saving..." : "Update Logo"}
          </button>
        </div>
      </div>

      {/* PASSWORD CARD */}
      <div className="bg-white border rounded-xl p-5">
        <div className="text-lg font-semibold mb-4">Change Password</div>

        {pwErrors.general ? (
          <div className="mb-3 text-sm text-red-600">{pwErrors.general}</div>
        ) : null}

        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={pw.current_password}
              onChange={(e) => setPwField("current_password", e.target.value)}
              className={[
                "w-full border rounded px-3 py-2",
                pwErrors.current_password ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              autoComplete="current-password"
            />
            {pwErrors.current_password ? (
              <div className="mt-1 text-sm text-red-600">{pwErrors.current_password}</div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              value={pw.new_password}
              onChange={(e) => setPwField("new_password", e.target.value)}
              className={[
                "w-full border rounded px-3 py-2",
                pwErrors.new_password ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              autoComplete="new-password"
            />
            {pwErrors.new_password ? (
              <div className="mt-1 text-sm text-red-600">{pwErrors.new_password}</div>
            ) : (
              <div className="mt-1 text-xs text-slate-500">Minimum 8 characters.</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={pw.confirm_password}
              onChange={(e) => setPwField("confirm_password", e.target.value)}
              className={[
                "w-full border rounded px-3 py-2",
                pwErrors.confirm_password ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              autoComplete="new-password"
            />
            {pwErrors.confirm_password ? (
              <div className="mt-1 text-sm text-red-600">{pwErrors.confirm_password}</div>
            ) : null}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPw}
              className={[
                "px-5 py-2 rounded text-white font-semibold",
                savingPw ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
              ].join(" ")}
            >
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* SUCCESS MODAL */}
      {showPwSuccess ? (
        <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border p-6 text-center">
            <div className="text-lg font-bold mb-2">Password Updated</div>
            <div className="text-sm text-slate-600">
              Your password has been updated successfully.
            </div>

            <button
              onClick={() => setShowPwSuccess(false)}
              className="mt-5 px-6 py-2 rounded bg-slate-900 text-white hover:bg-slate-800"
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

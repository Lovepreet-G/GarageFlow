import { useMemo, useState } from "react"
import api from "../api"

function Profile() {
  const shop = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("shop") || "null")
    } catch {
      return null
    }
  }, [])

  const API_BASE =  "http://localhost:5000" //import.meta.env.VITE_API_URL || "http://localhost:5000"

  const currentLogo = shop?.logo_url
    ? shop.logo_url.startsWith("http")
      ? shop.logo_url
      : `${API_BASE}${shop.logo_url}`
    : null

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [saving, setSaving] = useState(false)

  const onPick = (f) => {
    setError("")
    setSuccess("")

    if (!f) {
      setFile(null)
      setPreview("")
      return
    }

    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file.")
      return
    }

    if (f.size > 2 * 1024 * 1024) {
      setError("Max logo size is 2MB.")
      return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const saveLogo = async () => {
    setError("")
    setSuccess("")
    if (!file) {
      setError("Please select a logo file.")
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("logo", file)

      const res = await api.patch("shops/me/logo", fd)
      const newLogoUrl = res.data.logo_url

      // update localStorage shop so header updates immediately
      const current = JSON.parse(localStorage.getItem("shop") || "{}")
      const updated = { ...current, logo_url: newLogoUrl }
      localStorage.setItem("shop", JSON.stringify(updated))

      setSuccess("Logo updated successfully.")
      setFile(null)
      setPreview("")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update logo.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div>
          <div className="text-sm text-slate-500 mb-2">Current Logo</div>
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
              <div className="text-xs text-slate-500">Upload a new logo (PNG/JPG/WebP, max 2MB)</div>
            </div>
          </div>
        </div>

        <div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => onPick(e.target.files?.[0])}
            className="block w-full text-sm"
          />
          {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
          {success ? <div className="mt-2 text-sm text-green-700">{success}</div> : null}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setFile(null)
              setPreview("")
              setError("")
              setSuccess("")
            }}
            className="px-4 py-2 rounded border hover:bg-slate-50"
            disabled={saving}
          >
            Reset
          </button>

          <button
            type="button"
            onClick={saveLogo}
            disabled={saving || !file}
            className={[
              "px-4 py-2 rounded text-white font-semibold",
              saving || !file ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
            ].join(" ")}
          >
            {saving ? "Saving..." : "Update Logo"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile

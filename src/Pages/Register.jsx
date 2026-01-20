import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizePhone(phone) {
  // keep digits only
  return phone.replace(/[^\d]/g, "")
}

function isValidPhone(phone) {
  // Accept 10 digits (most common), or 11 digits starting with 1 (Canada/US)
  const digits = normalizePhone(phone)
  if (digits.length === 10) return true
  if (digits.length === 11 && digits.startsWith("1")) return true
  return false
}

function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    shop_name: "",
    logo_file: null, // optional (not sent unless you implement upload)
    shop_address: "",
    shop_phone: "",
    shop_email: "",
    confirm_email: "",
    tax_id: "",
    password: "",
    confirm_password: "",
    accept_terms: false,
  })

  const [errors, setErrors] = useState({
    shop_name: "",
    logo_file: "",
    shop_address: "",
    shop_phone: "",
    shop_email: "",
    confirm_email: "",
    tax_id: "",
    password: "",
    confirm_password: "",
    accept_terms: "",
    general: "",
  })

  const [loading, setLoading] = useState(false)

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }))
  }

  const validate = () => {
    const e = {
      shop_name: "",
      logo_file: "",
      shop_address: "",
      shop_phone: "",
      shop_email: "",
      confirm_email: "",
      tax_id: "",
      password: "",
      confirm_password: "",
      accept_terms: "",
      general: "",
    }

    if (!form.shop_name.trim()) e.shop_name = "Shop name is required."

    if (!form.shop_address.trim()) e.shop_address = "Address is required."

    if (!form.shop_phone.trim()) e.shop_phone = "Phone number is required."
    else if (!isValidPhone(form.shop_phone)) e.shop_phone = "Enter a valid phone number."

    if (!form.shop_email.trim()) e.shop_email = "Email is required."
    else if (!isValidEmail(form.shop_email.trim())) e.shop_email = "Enter a valid email."

    if (!form.confirm_email.trim()) e.confirm_email = "Confirm your email."
    else if (form.confirm_email.trim() !== form.shop_email.trim())
      e.confirm_email = "Emails do not match."

    // tax_id optional, but you can make it required if you want:
    // if (!form.tax_id.trim()) e.tax_id = "GST/HST number is required."

    if (!form.password) e.password = "Password is required."
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters."

    if (!form.confirm_password) e.confirm_password = "Confirm your password."
    else if (form.confirm_password !== form.password)
      e.confirm_password = "Passwords do not match."

    if (!form.accept_terms) e.accept_terms = "You must accept terms & conditions."

    // Logo validation (optional):
    // If user selected a file, enforce PNG only
    if (form.logo_file) {
      const okType =
        form.logo_file.type === "image/png" ||
        form.logo_file.name.toLowerCase().endsWith(".png")
      if (!okType) e.logo_file = "Logo must be a PNG file."
    }

    setErrors(e)
    return Object.values(e).every((v) => v === "")
  }

  const handleReset = () => {
    setForm({
      shop_name: "",
      logo_file: null,
      shop_address: "",
      shop_phone: "",
      shop_email: "",
      confirm_email: "",
      tax_id: "",
      password: "",
      confirm_password: "",
      accept_terms: false,
    })
    setErrors({
      shop_name: "",
      logo_file: "",
      shop_address: "",
      shop_phone: "",
      shop_email: "",
      confirm_email: "",
      tax_id: "",
      password: "",
      confirm_password: "",
      accept_terms: "",
      general: "",
    })
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
        const fd = new FormData()
        fd.append("shop_name", form.shop_name.trim())
        fd.append("shop_address", form.shop_address.trim())
        fd.append("shop_phone", form.shop_phone.trim())
        fd.append("shop_email", form.shop_email.trim())
        fd.append("password", form.password)
        fd.append("tax_id", form.tax_id.trim())
        if (form.logo_file) fd.append("logo", form.logo_file)

        await api.post("/auth/register", fd)
      // Since your backend INSERT does not include logo_url yet,
      // we send JSON only. We'll add logo upload later.
    //   await api.post("/auth/register", {
    //     shop_name: form.shop_name.trim(),
    //     shop_address: form.shop_address.trim(),
    //     shop_phone: form.shop_phone.trim(),
    //     shop_email: form.shop_email.trim(),
    //     password: form.password,
    //     tax_id: form.tax_id.trim() || null,
    //   })

      navigate("/login")
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed"

      // Map common backend errors to fields
      if (
        msg.toLowerCase().includes("email") &&
        (msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("duplicate"))
      ) {
        setErrors((prev) => ({ ...prev, shop_email: msg }))
      } else if (msg.toLowerCase().includes("phone") && msg.toLowerCase().includes("duplicate")) {
        setErrors((prev) => ({ ...prev, shop_phone: msg }))
      } else {
        setErrors((prev) => ({ ...prev, general: msg }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl bg-white border rounded-2xl p-6">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold">GarageFlow</div>
          <div className="text-sm text-slate-500">Create your shop account</div>
        </div>

        {errors.general ? (
          <div className="mb-4 text-sm text-red-600">{errors.general}</div>
        ) : null}

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Shop Name *</label>
            <input
              className={[
                "w-full border rounded px-3 py-2",
                errors.shop_name ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              value={form.shop_name}
              onChange={(e) => setField("shop_name", e.target.value)}
              placeholder="Your Shop Name"
            />
            {errors.shop_name ? (
              <div className="mt-1 text-sm text-red-600">{errors.shop_name}</div>
            ) : null}
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium mb-1">Logo (PNG)</label>
            <input
              type="file"
              accept="image/png"
              className={[
                "w-full border rounded px-3 py-2 bg-white",
                errors.logo_file ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              onChange={(e) => setField("logo_file", e.target.files?.[0] || null)}
            />
            {errors.logo_file ? (
              <div className="mt-1 text-sm text-red-600">{errors.logo_file}</div>
            ) : null}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Address *</label>
            <input
              className={[
                "w-full border rounded px-3 py-2",
                errors.shop_address ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              value={form.shop_address}
              onChange={(e) => setField("shop_address", e.target.value)}
              placeholder="123 Main Street, Toronto, ON"
            />
            {errors.shop_address ? (
              <div className="mt-1 text-sm text-red-600">{errors.shop_address}</div>
            ) : null}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <input
              className={[
                "w-full border rounded px-3 py-2",
                errors.shop_phone ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              value={form.shop_phone}
              onChange={(e) => setField("shop_phone", e.target.value)}
              placeholder="(416) 555-1234"
            />
            {errors.shop_phone ? (
              <div className="mt-1 text-sm text-red-600">{errors.shop_phone}</div>
            ) : null}
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-sm font-medium mb-1">GST/HST Number</label>
            <input
              className={[
                "w-full border rounded px-3 py-2",
                errors.tax_id ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              value={form.tax_id}
              onChange={(e) => setField("tax_id", e.target.value)}
              placeholder="Optional"
            />
            {errors.tax_id ? (
              <div className="mt-1 text-sm text-red-600">{errors.tax_id}</div>
            ) : null}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
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

          {/* Confirm Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Email *</label>
            <input
              type="email"
              className={[
                "w-full border rounded px-3 py-2",
                errors.confirm_email ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              value={form.confirm_email}
              onChange={(e) => setField("confirm_email", e.target.value)}
              placeholder="re-enter email"
              autoComplete="email"
            />
            {errors.confirm_email ? (
              <div className="mt-1 text-sm text-red-600">{errors.confirm_email}</div>
            ) : null}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <input
              type="password"
              className={[
                "w-full border rounded px-3 py-2",
                errors.password ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {errors.password ? (
              <div className="mt-1 text-sm text-red-600">{errors.password}</div>
            ) : null}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password *</label>
            <input
              type="password"
              className={[
                "w-full border rounded px-3 py-2",
                errors.confirm_password ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              value={form.confirm_password}
              onChange={(e) => setField("confirm_password", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {errors.confirm_password ? (
              <div className="mt-1 text-sm text-red-600">{errors.confirm_password}</div>
            ) : null}
          </div>

          {/* Terms */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.accept_terms}
                onChange={(e) => setField("accept_terms", e.target.checked)}
              />
              I agree to the Terms & Conditions
            </label>
            {errors.accept_terms ? (
              <div className="mt-1 text-sm text-red-600">{errors.accept_terms}</div>
            ) : null}
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded border hover:bg-slate-50"
              disabled={loading}
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={loading}
              className={[
                "px-4 py-2 rounded font-semibold text-white",
                loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800",
              ].join(" ")}
            >
              {loading ? "Creating..." : "Submit"}
            </button>
          </div>
        </form>

        <div className="text-sm text-center mt-5">
          <span className="text-slate-600">Already have an account?</span>{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register

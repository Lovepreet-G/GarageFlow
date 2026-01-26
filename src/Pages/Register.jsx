import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api"

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizePhone(phone) {
  return phone.replace(/[^\d]/g, "")
}

function isValidPhone(phone) {
  const digits = normalizePhone(phone)
  if (digits.length === 10) return true
  if (digits.length === 11 && digits.startsWith("1")) return true
  return false
}

function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
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

    if (!form.password) e.password = "Password is required."
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters."

    if (!form.confirm_password) e.confirm_password = "Confirm your password."
    else if (form.confirm_password !== form.password)
      e.confirm_password = "Passwords do not match."

    if (!form.accept_terms) e.accept_terms = "You must accept terms & conditions."

    // Logo: optional, but if selected enforce PNG
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
      navigate("/login")
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed"

      if (msg.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, shop_email: msg }))
      } else if (msg.toLowerCase().includes("phone")) {
        setErrors((prev) => ({ ...prev, shop_phone: msg }))
      } else {
        setErrors((prev) => ({ ...prev, general: msg }))
      }
    } finally {
      setLoading(false)
    }
  }

  const fileLabel = useMemo(() => {
    return form.logo_file?.name ? form.logo_file.name : "No file chosen"
  }, [form.logo_file])

  const inputBase =
    "w-full rounded-2xl bg-slate-100/70 px-4 py-3 border border-transparent " +
    "outline-none focus:bg-white focus:border-slate-300 focus:ring-4 focus:ring-slate-200 transition"

  const labelClass = "text-[11px] tracking-widest text-slate-400 font-semibold mb-2"

  const fieldWrap = "space-y-2"
  const errText = (msg) => (msg ? <div className="text-sm text-red-600">{msg}</div> : null)

  return (
    <div className="min-h-screen min-w-screen bg-slate-50 w-100 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 px-5 py-8 sm:px-10">
          {/* Header */}
          <div className="text-center">
            <div className="flex flex-col items-center gap-3">
                {/* Logo */}
                <img
                    src="../public/Logo_half.png"
                    alt="GarageFlow"
                    className="h-10 w-10 sm:h-14 sm:w-14 object-contain"
                />

                {/* Brand name */}
                <div className="text-2xl sm:text-3xl font-extrabold tracking-wide">
                    <span className="text-slate-900 italic">GARAGE</span>
                    <span className="text-cyan-600 italic">FLOW</span>
                </div>
            </div>


            <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              Join the <span className="text-cyan-600 italic">Flow</span>
            </div>

            <div className="mt-2 text-xs tracking-widest text-slate-400 font-semibold">
              CREATE YOUR SHOP ENVIRONMENT
            </div>
          </div>

          {/* General error */}
          {errors.general ? (
            <div className="mt-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              {errors.general}
            </div>
          ) : null}

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            {/* Grid: mobile 1 col, desktop 2 col */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Shop Name */}
              <div className={fieldWrap}>
                <div className={labelClass}>SHOP NAME *</div>
                <input
                  className={[
                    inputBase,
                    errors.shop_name ? "border-red-500 bg-red-50 focus:ring-red-100" : "",
                  ].join(" ")}
                  value={form.shop_name}
                  onChange={(e) => setField("shop_name", e.target.value)}
                  placeholder="e.g. Master Motors"
                />
                {errText(errors.shop_name)}
              </div>

              {/* Logo */}
              <div className={fieldWrap}>
                <div className={labelClass}>LOGO (PNG)</div>

                <div
                  className={[
                    "flex items-center gap-3 rounded-2xl bg-slate-100/70 px-4 py-3",
                    errors.logo_file ? "border border-red-500 bg-red-50" : "border border-transparent",
                  ].join(" ")}
                >
                  <label className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-sm font-semibold cursor-pointer hover:bg-indigo-900 whitespace-nowrap">
                    Choose File
                    <input
                      type="file"
                      accept="image/png"
                      className="hidden"
                      onChange={(e) => setField("logo_file", e.target.files?.[0] || null)}
                    />
                  </label>

                  <div className="text-sm text-slate-600 truncate">{fileLabel}</div>
                </div>

                {errText(errors.logo_file)}
              </div>

              {/* Address - full width */}
              <div className={[fieldWrap, "md:col-span-2"].join(" ")}>
                <div className={labelClass}>SERVICE ADDRESS *</div>
                <input
                  className={[
                    inputBase,
                    errors.shop_address ? "border-red-500 bg-red-50 focus:ring-red-100" : "",
                  ].join(" ")}
                  value={form.shop_address}
                  onChange={(e) => setField("shop_address", e.target.value)}
                  placeholder="123 Main St, Toronto, ON"
                />
                {errText(errors.shop_address)}
              </div>

              {/* Phone */}
              <div className={fieldWrap}>
                <div className={labelClass}>PHONE *</div>
                <input
                  className={[
                    inputBase,
                    errors.shop_phone ? "border-red-500 bg-red-50 focus:ring-red-100" : "",
                  ].join(" ")}
                  value={form.shop_phone}
                  onChange={(e) => setField("shop_phone", e.target.value)}
                  placeholder="(416) 555-1234"
                />
                {errText(errors.shop_phone)}
              </div>

              {/* Tax ID */}
              <div className={fieldWrap}>
                <div className={labelClass}>TAX ID / HST</div>
                <input
                  className={[
                    inputBase,
                    errors.tax_id ? "border-red-500 bg-red-50 focus:ring-red-100" : "",
                  ].join(" ")}
                  value={form.tax_id}
                  onChange={(e) => setField("tax_id", e.target.value)}
                  placeholder="RT0001 (Optional)"
                />
                {errText(errors.tax_id)}
              </div>

              {/* Email */}
              <div className={fieldWrap}>
                <div className={labelClass}>SHOP EMAIL *</div>
                <input
                  type="email"
                  className={[
                    inputBase,
                    errors.shop_email ? "border-red-500 bg-red-50 focus:ring-red-100" : "",
                  ].join(" ")}
                  value={form.shop_email}
                  onChange={(e) => setField("shop_email", e.target.value)}
                  placeholder="shop@garageflow.com"
                  autoComplete="email"
                />
                {errText(errors.shop_email)}
              </div>

              {/* Confirm Email */}
              <div className={fieldWrap}>
                <div className={labelClass}>VERIFY EMAIL *</div>
                <input
                  type="email"
                  className={[
                    inputBase,
                    errors.confirm_email ? "border-red-500 bg-red-50 focus:ring-red-100" : "",
                  ].join(" ")}
                  value={form.confirm_email}
                  onChange={(e) => setField("confirm_email", e.target.value)}
                  placeholder="Re-type email"
                  autoComplete="email"
                />
                {errText(errors.confirm_email)}
              </div>

              {/* Password */}
              <div className={fieldWrap}>
                <div className={labelClass}>PASSWORD *</div>
                <input
                  type="password"
                  className={[
                    inputBase,
                    errors.password ? "border-red-500 bg-red-50 focus:ring-red-100" : "",
                  ].join(" ")}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errText(errors.password)}
              </div>

              {/* Confirm password */}
              <div className={fieldWrap}>
                <div className={labelClass}>REPEAT PASSWORD *</div>
                <input
                  type="password"
                  className={[
                    inputBase,
                    errors.confirm_password ? "border-red-500 bg-red-50 focus:ring-red-100" : "",
                  ].join(" ")}
                  value={form.confirm_password}
                  onChange={(e) => setField("confirm_password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errText(errors.confirm_password)}
              </div>
            </div>

            {/* Terms */}
            <div className="pt-2">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={form.accept_terms}
                  onChange={(e) => setField("accept_terms", e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <a className="text-cyan-700 font-semibold hover:underline" href="#">
                    Terms & Conditions
                  </a>
                </span>
              </label>
              {errText(errors.accept_terms)}
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className={[
                  "w-full sm:w-auto px-8 py-3 rounded-2xl border font-semibold",
                  loading ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50",
                ].join(" ")}
              >
                CLEAR
              </button>

              <button
                type="submit"
                disabled={loading}
                className={[
                  "w-full sm:w-auto px-10 py-3 rounded-2xl font-semibold text-white shadow-lg",
                  loading ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-950 hover:bg-indigo-900",
                ].join(" ")}
              >
                {loading ? "CREATING..." : "IGNITE ENGINE"}
              </button>
            </div>

            {/* Footer */}
            <div className="text-sm text-center pt-2">
              <span className="text-slate-500">Already have an account?</span>{" "}
              <Link to="/login" className="text-cyan-700 font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-slate-400 mt-4">Powered by GarageFlow</div>
      </div>
    </div>
  )
}

export default Register

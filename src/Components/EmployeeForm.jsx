import { useEffect, useMemo, useRef, useState } from "react"
import departmentsApi from "../api/departmentsApi"
import employeesApi from "../api/employeesApi"

const digitsOnly = (v) => String(v || "").replace(/\D/g, "")

const formatPhone = (value) => {
  const digits = digitsOnly(value).slice(0, 10)
  const a = digits.slice(0, 3)
  const b = digits.slice(3, 6)
  const c = digits.slice(6, 10)

  if (digits.length > 6) return `(${a}) ${b}-${c}`
  if (digits.length > 3) return `(${a}) ${b}`
  if (digits.length > 0) return `(${a}`
  return ""
}

const caretPosFromDigits = (formatted, digitCount) => {
  if (!digitCount) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) seen++
    if (seen >= digitCount) return i + 1
  }
  return formatted.length
}

export default function EmployeeForm({ initial, onSaved, onCancel }) {
  const safeInitial = useMemo(() => initial || null, [initial])
  const isEdit = Boolean(safeInitial?.id)

  const [departments, setDepartments] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const mobileRef = useRef(null)

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    sin_number: "",
    department_id: "",
    hourly_rate: "",
    job_type: "Part-time",
    created_at: "",
    dob: "",

    address_street: "",
    address_unit: "",
    address_city: "",
    address_province: "",
    address_country: "",
    address_postal_code: "",
  })

  useEffect(() => {
    departmentsApi
      .listDepartments()
      .then((r) => setDepartments(r.data.departments || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!safeInitial) {
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        sin_number: "",
        department_id: "",
        hourly_rate: "",
        job_type: "Part-time",
        created_at: "",
        dob: "",

        address_street: "",
        address_unit: "",
        address_city: "",
        address_province: "",
        address_country: "",
        address_postal_code: "",
      })
      setErrors({})
      return
    }

    setForm({
      first_name: safeInitial.first_name || "",
      last_name: safeInitial.last_name || "",
      email: safeInitial.email || "",
      mobile: safeInitial.mobile || "",
      sin_number: safeInitial.sin_number || "",
      department_id: safeInitial.department_id || "",
      hourly_rate: safeInitial.hourly_rate ?? "",
      job_type: safeInitial.job_type || "Part-time",
      created_at: safeInitial.created_at ? String(safeInitial.created_at).slice(0, 10) : "",
      dob: safeInitial.dob ? String(safeInitial.dob).slice(0, 10) : "",

      address_street: safeInitial.address_street || "",
      address_unit: safeInitial.address_unit || "",
      address_city: safeInitial.address_city || "",
      address_province: safeInitial.address_province || "",
      address_country: safeInitial.address_country || "",
      address_postal_code: safeInitial.address_postal_code || "",
    })
    setErrors({})
  }, [safeInitial?.id])

  const generatedPassword = useMemo(() => {
    const cleanName = String(form.first_name || "").trim()
    const year = form.dob ? String(form.dob).slice(0, 4) : ""
    if (!cleanName || !year) return ""
    return `${cleanName}@${year}`
  }, [form.first_name, form.dob])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key] && !prev._form) return prev
      const copy = { ...prev }
      delete copy[key]
      delete copy._form
      return copy
    })
  }

  const validate = () => {
    const next = {}

    if (!String(form.first_name || "").trim()) {
      next.first_name = "First name is required"
    }

    const mobDigits = digitsOnly(form.mobile)
    if (!mobDigits) next.mobile = "Mobile is required"
    else if (mobDigits.length < 10) next.mobile = "Mobile must be at least 10 digits"

    if (!form.created_at) next.created_at = "Start date is required"
    if (!form.dob) next.dob = "Date of birth is required"

    if (String(form.hourly_rate ?? "").trim() === "") {
      next.hourly_rate = "Pay rate is required"
    } else if (!Number.isFinite(Number(form.hourly_rate))) {
      next.hourly_rate = "Pay rate must be a number"
    }

    return next
  }

  const handleMobileChange = (e) => {
    const input = e.target
    const raw = input.value
    const caret = input.selectionStart ?? raw.length
    const rawBeforeCaret = raw.slice(0, caret)
    const digitsBeforeCaret = digitsOnly(rawBeforeCaret).length

    const formatted = formatPhone(raw)
    setField("mobile", formatted)

    requestAnimationFrame(() => {
      const el = mobileRef.current
      if (!el) return
      const pos = caretPosFromDigits(formatted, digitsBeforeCaret)
      el.setSelectionRange(pos, pos)
    })
  }

  const handleMobilePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData?.getData("text") || ""
    const formatted = formatPhone(text)
    setField("mobile", formatted)

    requestAnimationFrame(() => {
      const el = mobileRef.current
      if (!el) return
      const d = digitsOnly(formatted).length
      const pos = caretPosFromDigits(formatted, d)
      el.setSelectionRange(pos, pos)
    })
  }

  const submit = async () => {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    try {
      setSaving(true)

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name ? form.last_name.trim() : null,
        email: form.email ? form.email.trim() : null,
        mobile: form.mobile ? form.mobile.trim() : null,
        sin_number: form.sin_number ? form.sin_number.trim() : null,
        department_id: form.department_id || null,
        hourly_rate: form.hourly_rate === "" ? null : form.hourly_rate,
        job_type: form.job_type || null,
        dob: form.dob,

        address_street: form.address_street ? form.address_street.trim() : null,
        address_unit: form.address_unit ? form.address_unit.trim() : null,
        address_city: form.address_city ? form.address_city.trim() : null,
        address_province: form.address_province ? form.address_province.trim() : null,
        address_country: form.address_country ? form.address_country.trim() : null,
        address_postal_code: form.address_postal_code ? form.address_postal_code.trim() : null,
      }

      if (isEdit) {
        await employeesApi.updateEmployee(safeInitial.id, payload)
      } else {
        await employeesApi.createEmployee({
          ...payload,
          created_at: form.created_at,
        })
      }

      onSaved && onSaved()
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        _form: e?.response?.data?.message || "Something went wrong. Please try again.",
      }))
    } finally {
      setSaving(false)
    }
  }

  const Label = ({ children }) => <label className="text-xs text-slate-500">{children}</label>
  const ErrorText = ({ msg }) => (msg ? <div className="text-xs text-rose-600 mt-1">{msg}</div> : null)

  return (
    <div className="space-y-4">
      {errors._form && (
        <div className="border border-rose-200 bg-rose-50 text-rose-700 rounded-xl p-3 text-sm">
          {errors._form}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>First Name *</Label>
          <input
            value={form.first_name}
            onChange={(e) => setField("first_name", e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="First name"
          />
          <ErrorText msg={errors.first_name} />
        </div>

        <div>
          <Label>Last Name</Label>
          <input
            value={form.last_name}
            onChange={(e) => setField("last_name", e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Last name"
          />
        </div>

        <div>
          <Label>Email</Label>
          <input
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Email"
          />
        </div>

        <div>
          <Label>Mobile *</Label>
          <input
            ref={mobileRef}
            inputMode="numeric"
            autoComplete="tel"
            value={form.mobile}
            onChange={handleMobileChange}
            onPaste={handleMobilePaste}
            className="border p-2 rounded w-full"
            placeholder="(647) 123-4567"
          />
          <ErrorText msg={errors.mobile} />
        </div>

        <div>
          <Label>SIN Number</Label>
          <input
            value={form.sin_number}
            onChange={(e) => setField("sin_number", e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="SIN (optional)"
          />
        </div>

        <div>
          <Label>Start Date *</Label>
          <input
            type="date"
            value={form.created_at}
            onChange={(e) => setField("created_at", e.target.value)}
            className="border p-2 rounded w-full"
            disabled={isEdit}
          />
          {isEdit && <div className="text-[11px] text-slate-400 mt-1">Start date can’t be edited.</div>}
          <ErrorText msg={errors.created_at} />
        </div>

        <div>
          <Label>Date of Birth *</Label>
          <input
            type="date"
            value={form.dob}
            onChange={(e) => setField("dob", e.target.value)}
            className="border p-2 rounded w-full"
          />
          <ErrorText msg={errors.dob} />
        </div>

        <div>
          <Label>Default Password</Label>
          <input
            value={generatedPassword}
            disabled
            className="border p-2 rounded w-full bg-slate-100 text-slate-600"
            placeholder="Auto-generated"
          />
          <div className="text-[11px] text-slate-400 mt-1">Format: FirstName@BirthYear</div>
        </div>

        <div>
          <Label>Department</Label>
          <select
            value={form.department_id}
            onChange={(e) => setField("department_id", e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Pay Rate (Hourly) *</Label>
          <input
            value={form.hourly_rate}
            onChange={(e) => setField("hourly_rate", e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Hourly rate"
          />
          <ErrorText msg={errors.hourly_rate} />
        </div>

        <div>
          <Label>Job Type</Label>
          <select
            value={form.job_type}
            onChange={(e) => setField("job_type", e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="Part-time">Part-time</option>
            <option value="Full-time">Full-time</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-50 border rounded-xl p-4">
        <div className="font-bold mb-3">Address</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Street Address</Label>
            <input
              value={form.address_street}
              onChange={(e) => setField("address_street", e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Street address"
            />
          </div>

          <div>
            <Label>Unit</Label>
            <input
              value={form.address_unit}
              onChange={(e) => setField("address_unit", e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Unit / Apt"
            />
          </div>

          <div>
            <Label>City</Label>
            <input
              value={form.address_city}
              onChange={(e) => setField("address_city", e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="City"
            />
          </div>

          <div>
            <Label>Province</Label>
            <input
              value={form.address_province}
              onChange={(e) => setField("address_province", e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Province"
            />
          </div>

          <div>
            <Label>Country</Label>
            <input
              value={form.address_country}
              onChange={(e) => setField("address_country", e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Country"
            />
          </div>

          <div>
            <Label>Postal Code</Label>
            <input
              value={form.address_postal_code}
              onChange={(e) => setField("address_postal_code", e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Postal code"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border">
            Cancel
          </button>
        )}
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-cyan-600 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}
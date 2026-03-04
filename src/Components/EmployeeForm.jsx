import { useEffect, useMemo, useState } from "react"
import api from "../api"
import departmentsApi from "../api/departmentsApi"

export default function EmployeeForm({ initial, onSaved, onCancel }) {
  const safeInitial = useMemo(() => initial || null, [initial])
  const isEdit = Boolean(safeInitial?.id)

  const [departments, setDepartments] = useState([])
  const [saving, setSaving] = useState(false)

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

    // ✅ Address fields
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

        address_street: "",
        address_unit: "",
        address_city: "",
        address_province: "",
        address_country: "",
        address_postal_code: "",
      })
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

      address_street: safeInitial.address_street || "",
      address_unit: safeInitial.address_unit || "",
      address_city: safeInitial.address_city || "",
      address_province: safeInitial.address_province || "",
      address_country: safeInitial.address_country || "",
      address_postal_code: safeInitial.address_postal_code || "",
    })
  }, [safeInitial?.id])

  const submit = async () => {
    try {
      const sinDigits = String(form.sin_number || "").replace(/\D/g, "")
      if (!sinDigits || sinDigits.length !== 9) return alert("SIN is required (9 digits)")
      if (!isEdit && !form.created_at) return alert("Start date is required")

      setSaving(true)

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name || null,
        email: form.email || null,
        mobile: form.mobile || null,
        sin_number: sinDigits,
        department_id: form.department_id || null,
        hourly_rate: form.hourly_rate === "" ? null : form.hourly_rate,
        job_type: form.job_type || null,

        // ✅ Address payload
        address_street: form.address_street || null,
        address_unit: form.address_unit || null,
        address_city: form.address_city || null,
        address_province: form.address_province || null,
        address_country: form.address_country || null,
        address_postal_code: form.address_postal_code || null,

        ...(isEdit ? {} : { created_at: form.created_at }),
      }

      if (isEdit) await api.patch(`/employees/${safeInitial.id}`, payload)
      else await api.post(`/employees`, payload)

      onSaved && onSaved()
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Error saving employee")
    } finally {
      setSaving(false)
    }
  }

  const L = ({ children }) => <label className="text-xs text-slate-500">{children}</label>

  return (
    <div className="space-y-4">
      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <L>First Name</L>
          <input
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="First name"
          />
        </div>

        <div>
          <L>Last Name</L>
          <input
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="Last name"
          />
        </div>

        <div>
          <L>Email</L>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="Email"
          />
        </div>

        <div>
          <L>Mobile</L>
          <input
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="Mobile"
          />
        </div>

        <div>
          <L>SIN Number</L>
          <input
            value={form.sin_number}
            onChange={(e) => setForm({ ...form, sin_number: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="SIN (9 digits)"
          />
        </div>

        <div>
          <L>Start Date</L>
          <input
            type="date"
            value={form.created_at}
            onChange={(e) => setForm({ ...form, created_at: e.target.value })}
            className="border p-2 rounded w-full"
            disabled={isEdit}
          />
          {isEdit && <div className="text-[11px] text-slate-400 mt-1">Start date can’t be edited.</div>}
        </div>

        <div>
          <L>Department</L>
          <select
            value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
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
          <L>Hourly Rate</L>
          <input
            value={form.hourly_rate}
            onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
            className="border p-2 rounded w-full"
            placeholder="Hourly rate"
          />
        </div>

        <div>
          <L>Job Type</L>
          <select
            value={form.job_type}
            onChange={(e) => setForm({ ...form, job_type: e.target.value })}
            className="border p-2 rounded w-full"
          >
            <option value="Part-time">Part-time</option>
            <option value="Full-time">Full-time</option>
          </select>
        </div>
      </div>

      {/* Address */}
      <div className="bg-slate-50 border rounded-xl p-4">
        <div className="font-bold mb-3">Address</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <L>Street Address</L>
            <input
              value={form.address_street}
              onChange={(e) => setForm({ ...form, address_street: e.target.value })}
              className="border p-2 rounded w-full"
              placeholder="Street address"
            />
          </div>

          <div>
            <L>Unit</L>
            <input
              value={form.address_unit}
              onChange={(e) => setForm({ ...form, address_unit: e.target.value })}
              className="border p-2 rounded w-full"
              placeholder="Unit / Apt"
            />
          </div>

          <div>
            <L>City</L>
            <input
              value={form.address_city}
              onChange={(e) => setForm({ ...form, address_city: e.target.value })}
              className="border p-2 rounded w-full"
              placeholder="City"
            />
          </div>

          <div>
            <L>Province</L>
            <input
              value={form.address_province}
              onChange={(e) => setForm({ ...form, address_province: e.target.value })}
              className="border p-2 rounded w-full"
              placeholder="Province"
            />
          </div>

          <div>
            <L>Country</L>
            <input
              value={form.address_country}
              onChange={(e) => setForm({ ...form, address_country: e.target.value })}
              className="border p-2 rounded w-full"
              placeholder="Country"
            />
          </div>

          <div>
            <L>Postal Code</L>
            <input
              value={form.address_postal_code}
              onChange={(e) => setForm({ ...form, address_postal_code: e.target.value })}
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
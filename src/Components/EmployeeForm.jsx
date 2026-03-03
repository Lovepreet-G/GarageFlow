import { useEffect, useMemo, useState } from "react"
import departmentsApi from "../api/departmentsApi"
import employeesApi from "../api/employeesApi"

export default function EmployeeForm({ initial, onSaved, onCancel }) {
  const safeInitial = useMemo(() => initial || null, [initial])

  const [departments, setDepartments] = useState([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    sin_number: "",
    department_id: "",
    role_id: "",
    job_type: "Part-time",
    hourly_rate: "",
    // ✅ Start date input – will be sent as created_at
    created_at: "", // YYYY-MM-DD
  })

  useEffect(() => {
    departmentsApi
      .listDepartments()
      .then((r) => setDepartments(r.data.departments || []))
      .catch(() => {})
  }, [])

  // ✅ stable dependency prevents maximum update depth
  useEffect(() => {
    if (!safeInitial) {
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        mobile: "",
        sin_number: "",
        department_id: "",
        role_id: "",
        job_type: "Part-time",
        hourly_rate: "",
        created_at: "",
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
      role_id: safeInitial.role_id || "",
      job_type: safeInitial.job_type || "Part-time",
      hourly_rate: safeInitial.hourly_rate ?? "",
      created_at: safeInitial.created_at ? String(safeInitial.created_at).slice(0, 10) : "",
    })
  }, [safeInitial?.id])

  const submit = async () => {
    try {
      const sinDigits = String(form.sin_number || "").replace(/\D/g, "")
      if (!sinDigits || sinDigits.length !== 9) {
        return alert("SIN number is required (9 digits)")
      }

      // ✅ Start date required (your requirement)
      if (!form.created_at) {
        return alert("Start date is required")
      }

      setSaving(true)

      const payload = {
        ...form,
        sin_number: sinDigits,
        department_id: form.department_id || null,
        role_id: form.role_id || null,
        hourly_rate: form.hourly_rate === "" ? null : form.hourly_rate,
      }

      if (safeInitial?.id) {
        await employeesApi.updateEmployee(safeInitial.id, payload)
      } else {
        await employeesApi.createEmployee(payload)
      }

      onSaved && onSaved()
    } catch (e) {
      alert(e?.response?.data?.message || "Error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          className="border p-2 rounded"
          placeholder="First name"
        />
        <input
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          className="border p-2 rounded"
          placeholder="Last name"
        />

        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 rounded"
          placeholder="Email"
        />
        <input
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          className="border p-2 rounded"
          placeholder="Mobile"
        />

        <input
          value={form.sin_number}
          onChange={(e) => setForm({ ...form, sin_number: e.target.value })}
          className="border p-2 rounded"
          placeholder="SIN number (9 digits)"
        />

        {/* ✅ Start date */}
        <div>
          <label className="text-xs text-slate-500">Start Date</label>
          <input
            type="date"
            value={form.created_at}
            onChange={(e) => setForm({ ...form, created_at: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>

        <select
          value={form.department_id}
          onChange={(e) => setForm({ ...form, department_id: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">None</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={form.role_id}
          onChange={(e) => setForm({ ...form, role_id: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Select role</option>
          <option value="1">Owner</option>
          <option value="2">Admin</option>
          <option value="3">Manager</option>
          <option value="4">Technician</option>
          <option value="5">ServiceAdvisor</option>
        </select>

        <select
          value={form.job_type}
          onChange={(e) => setForm({ ...form, job_type: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="Part-time">Part-time</option>
          <option value="Full-time">Full-time</option>
        </select>

        <input
          value={form.hourly_rate}
          onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
          className="border p-2 rounded"
          placeholder="Hourly rate"
        />
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
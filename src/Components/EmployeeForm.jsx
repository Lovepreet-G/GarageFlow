import { useEffect, useMemo, useState } from "react"
import departmentsApi from "../api/departmentsApi"
import employeesApi from "../api/employeesApi"

export default function EmployeeForm({ initial, onSaved, onCancel }) {
  // ✅ Make initial stable (no new {} each render)
  const safeInitial = useMemo(() => initial || null, [initial])

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    sin_number: "",
    department_id: "",
    role_id: "",
    hourly_rate: "",
  })

  const [departments, setDepartments] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    departmentsApi
      .listDepartments()
      .then((r) => setDepartments(r.data.departments || []))
      .catch(() => {})
  }, [])

  // ✅ Only run when editing a different employee (id changes)
  useEffect(() => {
    if (!safeInitial) {
      // Add mode: keep defaults (no loop)
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        sin_number: "",
        department_id: "",
        role_id: "",
        hourly_rate: "",
      })
      return
    }

    // Edit mode
    setForm({
      first_name: safeInitial.first_name || "",
      last_name: safeInitial.last_name || "",
      email: safeInitial.email || "",
      phone: safeInitial.phone || safeInitial.mobile || "",
      sin_number: safeInitial.sin_number || "",
      department_id: safeInitial.department_id || "",
      role_id: safeInitial.role_id || "",
      hourly_rate: safeInitial.hourly_rate ?? "",
    })
  }, [safeInitial?.id]) // ✅ key fix: stable dependency

  const submit = async () => {
    try {
      const sinDigits = String(form.sin_number || "").replace(/\D/g, "")
      if (!sinDigits || sinDigits.length !== 9) {
        return alert("SIN number is required (9 digits)")
      }

      setSaving(true)

      if (safeInitial?.id) {
        await employeesApi.updateEmployee(safeInitial.id, form)
      } else {
        await employeesApi.createEmployee(form)
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
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border p-2 rounded"
          placeholder="Phone"
        />

        {/* ✅ SIN */}
        <input
          value={form.sin_number}
          onChange={(e) => setForm({ ...form, sin_number: e.target.value })}
          className="border p-2 rounded"
          placeholder="SIN number (9 digits)"
        />

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
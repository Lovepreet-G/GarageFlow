import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api"
import departmentsApi from "../api/departmentsApi"
import EmployeeForm from "../components/EmployeeForm"
import ConfirmModal from "../components/ConfirmModal"

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const deptMap = useMemo(() => {
    const m = {}
    for (const d of departments) m[String(d.id)] = d.name
    return m
  }, [departments])

  const StatusBadge = ({ status }) => {
    const v = String(status || "").toLowerCase()
    const isActive = v === "active"

    const cls = isActive
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
      : "bg-rose-50 text-rose-700 border-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.35)]"

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-lg border font-semibold ${cls}`}>
        {isActive ? "Active" : "Inactive"}
      </span>
    )
  }

  const load = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes] = await Promise.allSettled([
        api.get(`/employees/${id}`),
        departmentsApi.listDepartments(),
      ])

      setData(empRes.status === "fulfilled" ? empRes.value.data.employee : null)
      setDepartments(deptRes.status === "fulfilled" ? deptRes.value.data.departments || [] : [])
    } catch {
      setData(null)
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!data) return <div>Employee not found</div>

  const isInactive = String(data.status || "").toLowerCase() === "inactive"

  const deactivate = async () => {
    try {
      await api.delete(`/employees/${id}`)
      setConfirmOpen(false)
      load()
    } catch (e) {
      alert(e?.response?.data?.message || "Error")
    }
  }

  const startDate = data.created_at ? String(data.created_at).slice(0, 10) : "—"
  const dob = data.dob ? String(data.dob).slice(0, 10) : "—"
  const endDate = data.updated_at ? String(data.updated_at).slice(0, 10) : "—"
  const deptName = data.department_id ? deptMap[String(data.department_id)] : "—"

  const addr = {
    street: data.address_street || "",
    unit: data.address_unit || "",
    city: data.address_city || "",
    province: data.address_province || "",
    country: data.address_country || "",
    postal: data.address_postal_code || "",
  }

  const line1 = [addr.street, addr.unit ? `Unit ${addr.unit}` : ""].filter(Boolean).join(", ")
  const line2 = [addr.city, addr.province, addr.postal].filter(Boolean).join(", ")
  const line3 = addr.country || ""

  const hasAnyAddress =
    Boolean(addr.street || addr.unit || addr.city || addr.province || addr.country || addr.postal)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button onClick={() => navigate("/employees")} className="text-sm text-slate-500 hover:underline">
            ← Back to Employees
          </button>

          <div className="mt-2 flex items-center gap-2">
            <div className="text-2xl font-extrabold">
              {data.first_name} {data.last_name}
            </div>
            <StatusBadge status={data.status} />
          </div>

          <div className="text-xs text-slate-400">Employee profile</div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setEditing((v) => !v)} className="px-3 py-2 rounded-xl border">
            {editing ? "Cancel Edit" : "Edit"}
          </button>

          <button
            onClick={() => !isInactive && setConfirmOpen(true)}
            disabled={isInactive}
            className={[
              "px-3 py-2 rounded-xl",
              isInactive ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-rose-600 text-white",
            ].join(" ")}
            title={isInactive ? "Employee already inactive" : "Remove (Deactivate)"}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <strong>Email</strong>
            <div className="text-slate-600">{data.email || "—"}</div>
          </div>

          <div>
            <strong>Mobile</strong>
            <div className="text-slate-600">{data.mobile || "—"}</div>
          </div>

          <div>
            <strong>SIN</strong>
            <div className="text-slate-600">
              {data.sin_number ? `***-***-${String(data.sin_number).slice(-3)}` : "—"}
            </div>
          </div>

          <div>
            <strong>Department</strong>
            <div className="text-slate-600">{deptName || "—"}</div>
          </div>

          <div>
            <strong>Status</strong>
            <div className="mt-1">
              <StatusBadge status={data.status} />
            </div>
          </div>

          <div>
            <strong>Date of Birth</strong>
            <div className="text-slate-600">{dob}</div>
          </div>

          <div>
            <strong>Start Date</strong>
            <div className="text-slate-600">{startDate}</div>
          </div>

          {isInactive && (
            <div>
              <strong>End Date</strong>
              <div className="text-slate-600">{endDate}</div>
            </div>
          )}

          <div className="col-span-2 mt-2">
            <strong>Address</strong>

            {!hasAnyAddress ? (
              <div className="text-slate-600 mt-1">—</div>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {line1 && (
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px]">•</span>
                    <span>{line1}</span>
                  </li>
                )}
                {line2 && (
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px]">•</span>
                    <span>{line2}</span>
                  </li>
                )}
                {line3 && (
                  <li className="flex items-start gap-2">
                    <span className="mt-[2px]">•</span>
                    <span>{line3}</span>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="bg-white border rounded-[20px] p-6">
          <h4 className="font-bold mb-2">Edit</h4>
          <EmployeeForm
            initial={data}
            onSaved={() => {
              setEditing(false)
              load()
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {confirmOpen && (
        <ConfirmModal
          title="Remove employee"
          message="Are you sure? This will deactivate the employee."
          onCancel={() => setConfirmOpen(false)}
          onConfirm={deactivate}
        />
      )}
    </div>
  )
}
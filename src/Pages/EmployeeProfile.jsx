import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import employeesApi from "../api/employeesApi"
import EmployeeForm from "../components/EmployeeForm"
import ConfirmModal from "../components/ConfirmModal"

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await employeesApi.getEmployee(id)
      setData(r.data.employee)
    } catch (e) {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const deactivate = async () => {
    try {
      await employeesApi.updateEmployee(id, { status: "inactive" })
      setConfirmOpen(false)
      load()
    } catch (e) {
      alert(e?.response?.data?.message || "Error")
    }
  }

  if (loading) return <div>Loading...</div>
  if (!data) return <div>Employee not found</div>

  const startDate = data.created_at ? String(data.created_at).slice(0, 10) : "—"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          {/* ✅ Back button */}
          <button
            onClick={() => navigate("/employees")}
            className="text-sm text-slate-500 hover:underline"
          >
            ← Back to Employees
          </button>

          <div className="mt-2 text-2xl font-extrabold">
            {data.first_name} {data.last_name}
          </div>
          <div className="text-xs text-slate-400">Employee profile</div>
        </div>

        <div className="flex gap-2">
          {/* ✅ Toggle button text */}
          <button
            onClick={() => setEditing((v) => !v)}
            className="px-3 py-2 rounded-xl border"
          >
            {editing ? "Cancel Edit" : "Edit"}
          </button>

          <button
            onClick={() => setConfirmOpen(true)}
            className="px-3 py-2 rounded-xl bg-rose-600 text-white"
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
            <strong>Phone</strong>
            <div className="text-slate-600">{data.mobile || "—"}</div>
          </div>

          <div>
            <strong>SIN</strong>
            <div className="text-slate-600">
              {data.sin_number ? `***-***-${String(data.sin_number).slice(-3)}` : "—"}
            </div>
          </div>

          <div>
            <strong>Role</strong>
            <div className="text-slate-600">{data.job_type || data.role_id || "—"}</div>
          </div>

          <div>
            <strong>Hourly rate</strong>
            <div className="text-slate-600">{data.hourly_rate ?? "—"}</div>
          </div>

          {/* ✅ Start date visible */}
          <div>
            <strong>Start Date</strong>
            <div className="text-slate-600">{startDate}</div>
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
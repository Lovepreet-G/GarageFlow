import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import ConfirmModal from "../Components/ConfirmModal"
import departmentsApi from "../api/departmentsApi"

export default function Employees() {
  const navigate = useNavigate()

  const [q, setQ] = useState("")
  const [rows, setRows] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)

  // ✅ Default: show Active only
  const [statusFilter, setStatusFilter] = useState("active")
  const [confirm, setConfirm] = useState({ open: false, employee: null })

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
        api.get("/employees", { params: { q } }),
        departmentsApi.listDepartments(),
      ])

      setRows(empRes.status === "fulfilled" ? empRes.value.data.employees || [] : [])
      setDepartments(deptRes.status === "fulfilled" ? deptRes.value.data.departments || [] : [])
    } catch (e) {
      console.error(e)
      setRows([])
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows
    return rows.filter((r) => String(r.status || "").toLowerCase() === statusFilter)
  }, [rows, statusFilter])

  const fullName = (r) => `${r.first_name || ""} ${r.last_name || ""}`.trim() || "—"

  const openRemove = (employee) => setConfirm({ open: true, employee })
  const closeRemove = () => setConfirm({ open: false, employee: null })

  const deactivate = async () => {
    if (!confirm.employee) return
    try {
      await api.delete(`/employees/${confirm.employee.id}`) // backend: deactivate
      closeRemove()
      load()
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Failed to deactivate employee")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-extrabold">Employees</div>
          <div className="text-xs text-slate-400">Click an employee to view profile</div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone…"
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>

          <button
            onClick={() => navigate("/employees/new")}
            className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold"
          >
            Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr className="text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rate</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-slate-400">
                    No employees found
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isInactive = String(r.status || "").toLowerCase() === "inactive"
                  const deptName = r.department_id ? deptMap[String(r.department_id)] : "—"

                  return (
                    <tr
                      key={r.id}
                      className="border-t hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/employees/${r.id}`)}
                    >
                      <td className="p-3 font-semibold">{fullName(r)}</td>
                      <td className="p-3">{deptName || "—"}</td>
                      <td className="p-3 text-slate-600">{r.mobile || "—"}</td>
                      <td className="p-3 text-slate-600">{r.email || "—"}</td>
                      <td className="p-3">{r.hourly_rate ?? "—"}</td>

                      <td className="p-3">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/employees/${r.id}`)}
                          className="px-3 py-1 rounded-xl border mr-2"
                        >
                          View
                        </button>

                        <button
                          onClick={() => !isInactive && openRemove(r)}
                          disabled={isInactive}
                          className={[
                            "px-3 py-1 rounded-xl",
                            isInactive
                              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                              : "bg-rose-600 text-white",
                          ].join(" ")}
                          title={isInactive ? "Employee already inactive" : "Remove (Deactivate)"}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirm.open && (
        <ConfirmModal
          title="Remove employee"
          message={`Are you sure you want to deactivate ${fullName(confirm.employee)}?`}
          onCancel={closeRemove}
          onConfirm={deactivate}
        />
      )}
    </div>
  )
}

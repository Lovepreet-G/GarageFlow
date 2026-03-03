import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import employeesApi from "../api/employeesApi"
import departmentsApi from "../api/departmentsApi"
import ConfirmModal from "../components/ConfirmModal"

const ROLE_LABELS = {
  Owner: "Owner",
  Admin: "Admin",
  Manager: "Manager",
  Technician: "Technician",
  ServiceAdvisor: "Service Advisor",
}

function getName(emp) {
  const fn = emp?.first_name || ""
  const ln = emp?.last_name || ""
  const full = `${fn} ${ln}`.trim()
  return full || emp?.name || "—"
}

export default function Employees() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [departments, setDepartments] = useState([])

  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all") // all | active | inactive
  const [departmentId, setDepartmentId] = useState("all")

  const [confirm, setConfirm] = useState({ open: false, employee: null })

  const deptMap = useMemo(() => {
    const m = {}
    for (const d of departments) m[String(d.id)] = d
    return m
  }, [departments])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return rows.filter((e) => {
      const matchesQuery =
        !query ||
        `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase().includes(query) ||
        String(e.email || "").toLowerCase().includes(query) ||
        String(e.phone || e.mobile || "").toLowerCase().includes(query)

      const matchesStatus =
        status === "all" ||
        String(e.status || "").toLowerCase() === status

      const matchesDept =
        departmentId === "all" ||
        String(e.department_id || "") === String(departmentId)

      return matchesQuery && matchesStatus && matchesDept
    })
  }, [rows, q, status, departmentId])

  const load = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes] = await Promise.allSettled([
        employeesApi.listEmployees({ q }),
        departmentsApi.listDepartments(),
      ])

      if (empRes.status === "fulfilled") setRows(empRes.value?.data?.employees || [])
      else setRows([])

      if (deptRes.status === "fulfilled") setDepartments(deptRes.value?.data?.departments || [])
      else setDepartments([])
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
  }, [])

  const openRemove = (employee) => setConfirm({ open: true, employee })
  const closeRemove = () => setConfirm({ open: false, employee: null })

  const remove = async () => {
    if (!confirm.employee) return
    try {
      // backend may soft-delete or delete; call delete endpoint
      await employeesApi.deleteEmployee(confirm.employee.id)
      closeRemove()
      await load()
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Failed to remove employee")
    }
  }

  const renderStatus = (s) => {
    const v = String(s || "").toLowerCase()
    const cls =
      v === "active"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : v === "inactive"
          ? "bg-slate-50 text-slate-600 border-slate-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
    return <span className={`inline-flex items-center px-2 py-1 text-xs rounded-lg border ${cls}`}>{s || "—"}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold">Employees</div>
          <div className="text-xs text-slate-400">Manage employees and view profiles</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/employees/new")}
            className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold"
          >
            Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone…"
              className="border rounded-lg px-3 py-2 text-sm w-full md:w-80"
            />

            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={load} className="px-3 py-2 rounded-xl border text-sm">
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr className="text-left">
                <th className="p-3">Employee</th>
                <th className="p-3">Department</th>
                <th className="p-3">Role</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-4 text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-slate-400">No employees found</td></tr>
              ) : (
                filtered.map((e) => {
                  const dept = e.department_id ? deptMap[String(e.department_id)] : null
                  const roleText = ROLE_LABELS[e.role] || ROLE_LABELS[e.role_id] || e.role || e.role_id || e.job_type || "—"
                  return (
                    <tr
                      key={e.id}
                      className="border-t hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/employees/${e.id}`)}
                    >
                      <td className="p-3 font-semibold">{getName(e)}</td>
                      <td className="p-3 text-slate-600">{dept?.name || "—"}</td>
                      <td className="p-3">{roleText}</td>
                      <td className="p-3 text-slate-600">{e.email || "—"}</td>
                      <td className="p-3 text-slate-600">{e.phone || e.mobile || "—"}</td>
                      <td className="p-3">{renderStatus(e.status)}</td>
                      <td className="p-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/employees/${e.id}`)}
                          className="px-3 py-1 rounded-xl border mr-2"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/employees/${e.id}?edit=1`)}
                          className="px-3 py-1 rounded-xl border mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openRemove(e)}
                          className="px-3 py-1 rounded-xl bg-rose-600 text-white"
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
          message={`Are you sure you want to remove ${getName(confirm.employee)}? This action cannot be undone.`}
          onCancel={closeRemove}
          onConfirm={remove}
        />
      )}
    </div>
  )
}

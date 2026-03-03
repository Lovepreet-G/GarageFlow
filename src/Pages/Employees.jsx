import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import ConfirmModal from "../components/ConfirmModal"

export default function Employees() {
  const navigate = useNavigate()

  const [q, setQ] = useState("")
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const [statusFilter, setStatusFilter] = useState("all") // all | active | inactive
  const [confirm, setConfirm] = useState({ open: false, employee: null })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get("/employees", { params: { q } })
      setRows(res.data.employees || [])
    } catch (e) {
      console.error(e)
      setRows([])
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

  // ✅ “Remove” = deactivate (so it still shows when filter = ALL)
  const deactivate = async () => {
    if (!confirm.employee) return
    try {
      await api.patch(`/employees/${confirm.employee.id}`, { status: "inactive" })
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
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
                <th className="p-3">Mobile</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
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
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/employees/${r.id}`)}
                  >
                    <td className="p-3 font-semibold">{fullName(r)}</td>
                    <td className="p-3 text-slate-600">{r.mobile || "—"}</td>
                    <td className="p-3 text-slate-600">{r.email || "—"}</td>
                    <td className="p-3">{r.job_type || r.role_id || "—"}</td>
                    <td className="p-3">{r.hourly_rate ?? "—"}</td>
                    <td className="p-3">{r.status || "—"}</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/employees/${r.id}`)}
                        className="px-3 py-1 rounded-xl border mr-2"
                      >
                        View
                      </button>

                      {/* ✅ Removed Edit button from list */}
                      <button
                        onClick={() => openRemove(r)}
                        className="px-3 py-1 rounded-xl bg-rose-600 text-white"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirm.open && (
        <ConfirmModal
          title="Remove employee"
          message={`Are you sure you want to remove ${fullName(confirm.employee)}? This will deactivate them.`}
          onCancel={closeRemove}
          onConfirm={deactivate}
        />
      )}
    </div>
  )
}
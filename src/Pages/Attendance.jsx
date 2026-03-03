import { useEffect, useMemo, useState } from "react"
import attendanceApi from "../api/attendanceApi"
import employeesApi from "../api/employeesApi"

function getMonday(d) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  x.setDate(x.getDate() + diff)
  return x
}
function fmt(d) {
  return new Date(d).toISOString().slice(0, 10)
}
function getName(emp) {
  const fn = emp?.first_name || ""
  const ln = emp?.last_name || ""
  const full = `${fn} ${ln}`.trim()
  return full || emp?.name || "—"
}

export default function Attendance() {
  const [weekStart, setWeekStart] = useState(fmt(getMonday(new Date())))
  const [rows, setRows] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)

  const [employeeId, setEmployeeId] = useState("all")

  const empMap = useMemo(() => {
    const m = {}
    for (const e of employees) m[String(e.id)] = e
    return m
  }, [employees])

  const filtered = useMemo(() => {
    if (employeeId === "all") return rows
    return rows.filter((r) => String(r.employee_id) === String(employeeId))
  }, [rows, employeeId])

  const load = async () => {
    setLoading(true)
    try {
      const [aRes, eRes] = await Promise.allSettled([
        attendanceApi.getAttendance({ weekStart }),
        employeesApi.listEmployees(),
      ])
      if (aRes.status === "fulfilled") setRows(aRes.value?.data?.attendance || [])
      else setRows([])
      if (eRes.status === "fulfilled") setEmployees(eRes.value?.data?.employees || [])
      else setEmployees([])
    } catch (e) {
      console.error(e)
      setRows([])
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [weekStart])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold">Attendance</div>
          <div className="text-xs text-slate-400">Punch in/out is auto-generated from schedule</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="border p-2 rounded"
          />
          <button onClick={load} className="px-3 py-2 rounded-xl border text-sm">
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-[20px] p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full md:w-72"
          >
            <option value="all">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {getName(e)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-4 text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-slate-400">No attendance for this week</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Scheduled</th>
                  <th className="p-3 text-left">Punch In</th>
                  <th className="p-3 text-left">Punch Out</th>
                  <th className="p-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const emp = empMap[String(r.employee_id)]
                  return (
                    <tr key={r.id || `${r.employee_id}_${r.work_date}`} className="border-t">
                      <td className="p-3 font-semibold">{emp ? getName(emp) : `#${r.employee_id}`}</td>
                      <td className="p-3">{r.work_date}</td>
                      <td className="p-3">
                        {r.scheduled_start} – {r.scheduled_end}
                      </td>
                      <td className="p-3">{r.punch_in}</td>
                      <td className="p-3">{r.punch_out}</td>
                      <td className="p-3 text-slate-600">{r.source || "schedule"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

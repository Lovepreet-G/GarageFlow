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

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return fmt(d)
}

function getName(emp) {
  const fn = emp?.first_name || ""
  const ln = emp?.last_name || ""
  const full = `${fn} ${ln}`.trim()
  return full || emp?.name || "—"
}

function calculateHours(start, end) {
  if (!start || !end) return "0.00"
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)

  let startMins = sh * 60 + sm
  let endMins = eh * 60 + em

  if (endMins < startMins) endMins += 24 * 60

  const diff = (endMins - startMins) / 60
  return diff.toFixed(2)
}

export default function Attendance() {
  const [weekStart, setWeekStart] = useState(fmt(getMonday(new Date())))
  const [rows, setRows] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [employeeId, setEmployeeId] = useState("all")
  const [dirtyMap, setDirtyMap] = useState({})

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
      const [aRes, eRes] = await Promise.all([
        attendanceApi.getAttendance({ weekStart }),
        employeesApi.listEmployees(),
      ])

      setRows(aRes.data.attendance || [])
      setEmployees(eRes.data.employees || [])
      setDirtyMap({})
    } catch (e) {
      console.error(e)
      setRows([])
      setEmployees([])
      setDirtyMap({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [weekStart])

  const goPrevWeek = () => setWeekStart((prev) => addDays(prev, -7))
  const goNextWeek = () => setWeekStart((prev) => addDays(prev, 7))
  const handleWeekInput = (value) => setWeekStart(fmt(getMonday(value)))

  const updateCell = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
    setDirtyMap((prev) => ({ ...prev, [id]: true }))
  }

  const saveChanges = async () => {
    const dirtyRows = rows.filter((r) => dirtyMap[r.id])
    if (!dirtyRows.length) return

    try {
      setSaving(true)

      for (const row of dirtyRows) {
        await attendanceApi.updateAttendance(row.id, {
          punch_in: row.punch_in,
          punch_out: row.punch_out,
        })
      }

      await load()
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Failed to update attendance")
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-extrabold">Attendance</div>
          <div className="text-xs text-slate-400">
            Scheduled punches are defaulted from schedule. You can edit actual punch times here.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={goPrevWeek} className="px-3 py-2 rounded-xl border">
            Prev Week
          </button>

          <input
            type="date"
            value={weekStart}
            onChange={(e) => handleWeekInput(e.target.value)}
            className="border p-2 rounded"
          />

          <button onClick={goNextWeek} className="px-3 py-2 rounded-xl border">
            Next Week
          </button>

          <button
            onClick={saveChanges}
            disabled={!Object.keys(dirtyMap).length || saving}
            className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold disabled:opacity-50"
          >
            {saving ? "Saving..." : `Save Changes${Object.keys(dirtyMap).length ? ` (${Object.keys(dirtyMap).length})` : ""}`}
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
          <div className="p-4 text-slate-400">Loading...</div>
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
                  <th className="p-3 text-left">Worked Hours</th>
                  <th className="p-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const emp = empMap[String(r.employee_id)]
                  const workedHours = calculateHours(r.punch_in, r.punch_out)

                  return (
                    <tr key={r.id || `${r.employee_id}_${r.work_date}`} className="border-t">
                      <td className="p-3 font-semibold">{emp ? getName(emp) : `#${r.employee_id}`}</td>
                      <td className="p-3">{r.work_date}</td>
                      <td className="p-3">
                        {r.scheduled_start} - {r.scheduled_end}
                      </td>
                      <td className="p-3">
                        <input
                          type="time"
                          value={r.punch_in || ""}
                          onChange={(e) => updateCell(r.id, "punch_in", e.target.value)}
                          className="border rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="time"
                          value={r.punch_out || ""}
                          onChange={(e) => updateCell(r.id, "punch_out", e.target.value)}
                          className="border rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-3 font-semibold">{workedHours}</td>
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
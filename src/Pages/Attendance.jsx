import { useEffect, useMemo, useState } from "react"
import attendanceApi from "../api/attendanceApi"
import employeesApi from "../api/employeesApi"
import departmentsApi from "../api/departmentsApi"

function parseLocalDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function formatLocalDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function addDays(dateStr, days) {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + days)
  return formatLocalDate(d)
}

function normalizeDateOnly(value) {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value)
  return formatLocalDate(new Date(value))
}

function getName(emp) {
  const fn = emp?.first_name || ""
  const ln = emp?.last_name || ""
  const full = `${fn} ${ln}`.trim()
  return full || emp?.name || "—"
}

function formatTime12(value) {
  if (!value) return "—"
  const [rawH = "0", rawM = "00"] = String(value).split(":")
  let h = Number(rawH)
  const m = String(rawM).padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m} ${ampm}`
}

function to12Parts(value) {
  if (!value) return { hour: "", minute: "00", ampm: "AM" }

  const [rawH = "0", rawM = "00"] = String(value).split(":")
  let h = Number(rawH)
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12

  return {
    hour: String(h),
    minute: String(rawM).padStart(2, "0"),
    ampm,
  }
}

function to24Hour(hour, minute, ampm) {
  if (!hour) return ""
  let h = Number(hour)
  const m = String(minute || "00").padStart(2, "0")

  if (ampm === "AM") {
    if (h === 12) h = 0
  } else {
    if (h !== 12) h += 12
  }

  return `${String(h).padStart(2, "0")}:${m}`
}

function calculateWorkedHours(punchIn, punchOut, breakStart, breakEnd) {
  if (!punchIn || !punchOut) return "0.00"

  const toMinutes = (v) => {
    const [h, m] = String(v).split(":").map(Number)
    return h * 60 + m
  }

  let start = toMinutes(punchIn)
  let end = toMinutes(punchOut)
  if (end < start) end += 24 * 60

  let total = end - start

  if (breakStart && breakEnd) {
    let bs = toMinutes(breakStart)
    let be = toMinutes(breakEnd)
    if (be < bs) be += 24 * 60
    total -= Math.max(0, be - bs)
  }

  return (total / 60).toFixed(2)
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

function TimeEditor({ value, onChange }) {
  const parts = useMemo(() => to12Parts(value), [value])

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        value={parts.hour}
        onChange={(e) => onChange(to24Hour(e.target.value, parts.minute, parts.ampm))}
        className="border rounded px-2 py-2"
      >
        <option value="">Hour</option>
        {HOUR_OPTIONS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <select
        value={parts.minute}
        onChange={(e) => onChange(to24Hour(parts.hour, e.target.value, parts.ampm))}
        className="border rounded px-2 py-2"
      >
        {MINUTE_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={parts.ampm}
        onChange={(e) => onChange(to24Hour(parts.hour, parts.minute, e.target.value))}
        className="border rounded px-2 py-2"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

export default function Attendance() {
  const [date, setDate] = useState(formatLocalDate(new Date()))
  const [rows, setRows] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  const attendanceMap = useMemo(() => {
    const m = {}
    for (const r of rows) m[String(r.employee_id)] = r
    return m
  }, [rows])

  const deptMap = useMemo(() => {
    const m = {}
    for (const d of departments) m[String(d.id)] = d.name
    return m
  }, [departments])

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase()
    const active = employees.filter((e) => String(e.status || "").toLowerCase() === "active")

    if (!q) return active

    return active.filter((e) => {
      const name = getName(e).toLowerCase()
      const dept = (deptMap[String(e.department_id)] || "").toLowerCase()
      const email = String(e.email || "").toLowerCase()
      return name.includes(q) || dept.includes(q) || email.includes(q)
    })
  }, [employees, search, deptMap])

  useEffect(() => {
    if (!selectedEmployeeId && filteredEmployees.length) {
      setSelectedEmployeeId(filteredEmployees[0].id)
    } else if (
      selectedEmployeeId &&
      !filteredEmployees.some((e) => String(e.id) === String(selectedEmployeeId))
    ) {
      setSelectedEmployeeId(filteredEmployees[0]?.id || null)
    }
  }, [filteredEmployees, selectedEmployeeId])

  const selectedEmployee = useMemo(
    () => employees.find((e) => String(e.id) === String(selectedEmployeeId)) || null,
    [employees, selectedEmployeeId]
  )

  const selectedAttendance = useMemo(
    () => attendanceMap[String(selectedEmployeeId)] || null,
    [attendanceMap, selectedEmployeeId]
  )

  const [form, setForm] = useState({
    punch_in: "",
    punch_out: "",
    break_start: "",
    break_end: "",
  })

  useEffect(() => {
    if (selectedAttendance) {
      setForm({
        punch_in: selectedAttendance.punch_in || "",
        punch_out: selectedAttendance.punch_out || "",
        break_start: selectedAttendance.break_start || "",
        break_end: selectedAttendance.break_end || "",
      })
    } else {
      setForm({
        punch_in: "",
        punch_out: "",
        break_start: "",
        break_end: "",
      })
    }
  }, [selectedAttendance])

  const load = async () => {
    setLoading(true)
    try {
      const [aRes, eRes, dRes] = await Promise.all([
        attendanceApi.getAttendance({ date }),
        employeesApi.listEmployees(),
        departmentsApi.listDepartments(),
      ])

      const attendanceRows = (aRes.data.attendance || []).map((r) => ({
        ...r,
        work_date: normalizeDateOnly(r.work_date),
      }))

      setRows(attendanceRows)
      setEmployees(eRes.data.employees || [])
      setDepartments(dRes.data.departments || [])
    } catch (e) {
      console.error(e)
      setRows([])
      setEmployees([])
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [date])

  const goPrevDay = () => setDate((prev) => addDays(prev, -1))
  const goNextDay = () => setDate((prev) => addDays(prev, 1))

  const statusLabel = (empId) => {
    const row = attendanceMap[String(empId)]
    if (!row) return "No record"
    return row.source === "manual" ? "Adjusted" : "Scheduled"
  }

  const workedHours = calculateWorkedHours(
    form.punch_in,
    form.punch_out,
    form.break_start,
    form.break_end
  )

  const updateAttendance = async () => {
    if (!selectedAttendance?.id) return

    try {
      setSaving(true)

      await attendanceApi.updateAttendance(selectedAttendance.id, {
        punch_in: form.punch_in,
        punch_out: form.punch_out,
        break_start: form.break_start || null,
        break_end: form.break_end || null,
      })

      await load()
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Failed to update attendance")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-extrabold">Attendance</div>
          <div className="text-xs text-slate-400">
            View attendance day-wise. Select an employee to update punch and break time.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={goPrevDay} className="px-3 py-2 rounded-xl border">
            Prev Day
          </button>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded"
          />

          <button onClick={goNextDay} className="px-3 py-2 rounded-xl border">
            Next Day
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white border rounded-[20px] p-4 space-y-3">
          <div className="font-bold">Employees</div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="border rounded-lg px-3 py-2 text-sm w-full"
          />

          {loading ? (
            <div className="p-4 text-slate-400">Loading...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-4 text-slate-400">No employees found</div>
          ) : (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {filteredEmployees.map((emp) => {
                const active = String(selectedEmployeeId) === String(emp.id)
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setSelectedEmployeeId(emp.id)}
                    className={[
                      "w-full text-left border rounded-xl p-3 transition",
                      active ? "border-cyan-500 bg-cyan-50" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="font-semibold">{getName(emp)}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Department: {deptMap[String(emp.department_id)] || "—"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Attendance: {statusLabel(emp.id)}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-[20px] p-4 md:p-6">
          {!selectedEmployee ? (
            <div className="text-slate-400">Select an employee</div>
          ) : (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setSelectedEmployeeId(null)}
                className="lg:hidden text-sm text-slate-500 hover:underline"
              >
                ← Back to Employees
              </button>

              <div>
                <div className="text-2xl font-extrabold">{getName(selectedEmployee)}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {date} • Department: {deptMap[String(selectedEmployee.department_id)] || "—"}
                </div>
              </div>

              {!selectedAttendance ? (
                <div className="border rounded-xl p-4 text-slate-500">
                  No attendance record for this employee on {date}.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-xl p-4 bg-slate-50">
                      <div className="text-xs text-slate-500">Scheduled Shift</div>
                      <div className="font-semibold mt-1">
                        {formatTime12(selectedAttendance.scheduled_start)} -{" "}
                        {formatTime12(selectedAttendance.scheduled_end)}
                      </div>
                      {(selectedAttendance.break_start || selectedAttendance.break_end) ? (
                        <div className="text-sm text-slate-500 mt-2">
                          Scheduled Break: {formatTime12(selectedAttendance.break_start)} -{" "}
                          {formatTime12(selectedAttendance.break_end)}
                        </div>
                      ) : null}
                    </div>

                    <div className="border rounded-xl p-4 bg-cyan-50">
                      <div className="text-xs text-slate-500">Worked Hours After Break</div>
                      <div className="text-2xl font-extrabold mt-1">{workedHours}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Calculated from punch in/out minus break time
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs text-slate-500">Punch In</label>
                      <div className="mt-1">
                        <TimeEditor
                          value={form.punch_in}
                          onChange={(value) => setForm((prev) => ({ ...prev, punch_in: value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500">Punch Out</label>
                      <div className="mt-1">
                        <TimeEditor
                          value={form.punch_out}
                          onChange={(value) => setForm((prev) => ({ ...prev, punch_out: value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500">Break Start</label>
                      <div className="mt-1">
                        <TimeEditor
                          value={form.break_start}
                          onChange={(value) => setForm((prev) => ({ ...prev, break_start: value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500">Break End</label>
                      <div className="mt-1">
                        <TimeEditor
                          value={form.break_end}
                          onChange={(value) => setForm((prev) => ({ ...prev, break_end: value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={updateAttendance}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold disabled:opacity-50"
                    >
                      {saving ? "Updating..." : "Update"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
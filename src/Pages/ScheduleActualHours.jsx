import { useEffect, useMemo, useState } from "react"
import attendanceApi from "../api/attendanceApi"
import employeesApi from "../api/employeesApi"

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

function getMonday(dateInput) {
  const d = typeof dateInput === "string" ? parseLocalDate(dateInput) : new Date(dateInput)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function weekLabel(weekStart) {
  const start = parseLocalDate(weekStart)
  const end = parseLocalDate(weekStart)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

function getEmployeeName(employee) {
  const firstName = employee?.first_name || ""
  const lastName = employee?.last_name || ""
  return `${firstName} ${lastName}`.trim() || employee?.name || "-"
}

function formatTime12(value) {
  if (!value) return "-"
  const [rawHour = "0", rawMinute = "00"] = String(value).split(":")
  let hour = Number(rawHour)
  const minute = String(rawMinute).padStart(2, "0")
  const period = hour >= 12 ? "PM" : "AM"
  hour = hour % 12
  if (hour === 0) hour = 12
  return `${hour}:${minute} ${period}`
}

function calculateWorkedHours(punchIn, punchOut, breakStart, breakEnd) {
  if (!punchIn || !punchOut) return 0

  const toMinutes = (value) => {
    const [hour, minute] = String(value).split(":").map(Number)
    return hour * 60 + minute
  }

  let start = toMinutes(punchIn)
  let end = toMinutes(punchOut)
  if (end < start) end += 24 * 60

  let totalMinutes = end - start

  if (breakStart && breakEnd) {
    let breakMinutesStart = toMinutes(breakStart)
    let breakMinutesEnd = toMinutes(breakEnd)
    if (breakMinutesEnd < breakMinutesStart) breakMinutesEnd += 24 * 60
    totalMinutes -= Math.max(0, breakMinutesEnd - breakMinutesStart)
  }

  return Number((totalMinutes / 60).toFixed(2))
}

export default function ScheduleActualHours() {
  const [weekStart, setWeekStart] = useState(formatLocalDate(getMonday(new Date())))
  const [employees, setEmployees] = useState([])
  const [attendanceRows, setAttendanceRows] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all")
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const week = useMemo(() => {
    const start = parseLocalDate(weekStart)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return formatLocalDate(date)
    })
  }, [weekStart])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [employeesRes, attendanceRes] = await Promise.all([
          employeesApi.listEmployees(),
          attendanceApi.getAttendance({ weekStart }),
        ])

        setEmployees(employeesRes.data?.employees || [])
        setAttendanceRows(attendanceRes.data?.attendance || [])
      } catch (error) {
        console.error(error)
        setEmployees([])
        setAttendanceRows([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [weekStart])

  const attendanceMap = useMemo(() => {
    const map = {}
    for (const row of attendanceRows) {
      map[`${row.employee_id}_${row.work_date}`] = row
    }
    return map
  }, [attendanceRows])

  const activeEmployees = useMemo(() => {
    return employees.filter((employee) => String(employee.status || "").toLowerCase() === "active")
  }, [employees])

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase()
    const queryDigits = employeeSearch.replace(/\D/g, "")

    if (!query && !queryDigits) return activeEmployees

    return activeEmployees.filter((employee) => {
      const name = getEmployeeName(employee).toLowerCase()
      const mobile = String(employee.mobile || "")
      const mobileDigits = mobile.replace(/\D/g, "")

      return name.includes(query) || (queryDigits && mobileDigits.includes(queryDigits))
    })
  }, [activeEmployees, employeeSearch])

  const selectedEmployeeLabel = useMemo(() => {
    if (selectedEmployeeId === "all") return "All Employees"
    const employee = activeEmployees.find((item) => String(item.id) === String(selectedEmployeeId))
    if (!employee) return "Select Employee"
    return `${getEmployeeName(employee)}${employee.mobile ? ` (${employee.mobile})` : ""}`
  }, [activeEmployees, selectedEmployeeId])

  const visibleEmployees = useMemo(() => {
    if (selectedEmployeeId === "all") return activeEmployees
    return activeEmployees.filter((employee) => String(employee.id) === String(selectedEmployeeId))
  }, [activeEmployees, selectedEmployeeId])

  const summaries = useMemo(() => {
    return visibleEmployees.map((employee) => {
      const days = week.map((date) => {
        const attendance = attendanceMap[`${employee.id}_${date}`] || null
        const hours = attendance
          ? calculateWorkedHours(
              attendance.punch_in,
              attendance.punch_out,
              attendance.break_start,
              attendance.break_end
            )
          : 0

        return { date, attendance, hours }
      })

      const totalHours = Number(days.reduce((sum, day) => sum + day.hours, 0).toFixed(2))
      return { employee, days, totalHours }
    })
  }, [visibleEmployees, week, attendanceMap])

  const goPrevWeek = () => {
    const monday = getMonday(weekStart)
    monday.setDate(monday.getDate() - 7)
    setWeekStart(formatLocalDate(monday))
  }

  const goNextWeek = () => {
    const monday = getMonday(weekStart)
    monday.setDate(monday.getDate() + 7)
    setWeekStart(formatLocalDate(monday))
  }

  const selectEmployee = (employeeId) => {
    setSelectedEmployeeId(employeeId)
    setEmployeeDropdownOpen(false)
    setEmployeeSearch("")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <div className="text-2xl font-extrabold">Actual Hours</div>
          <div className="text-xs text-slate-400">
            Weekly punched hours from attendance with totals you can later reuse for payroll.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={goPrevWeek} className="px-3 py-2 rounded-xl border">
            Prev Week
          </button>

          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(formatLocalDate(getMonday(e.target.value)))}
            className="border p-2 rounded"
          />

          <button onClick={goNextWeek} className="px-3 py-2 rounded-xl border">
            Next Week
          </button>
        </div>

        <div className="max-w-md">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Employee Filter
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setEmployeeDropdownOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm"
            >
              <span className="truncate">{selectedEmployeeLabel}</span>
              <span className={`ml-3 text-slate-400 transition-transform ${employeeDropdownOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>

            {employeeDropdownOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border bg-white p-3 shadow-lg">
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search by name or number..."
                  className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                />

                <div className="max-h-64 space-y-1 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => selectEmployee("all")}
                    className={[
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                      selectedEmployeeId === "all" ? "bg-cyan-50 text-cyan-700" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    All Employees
                  </button>

                  {filteredEmployees.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-400">No employees match your search.</div>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() => selectEmployee(String(employee.id))}
                        className={[
                          "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                          String(selectedEmployeeId) === String(employee.id)
                            ? "bg-cyan-50 text-cyan-700"
                            : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="font-medium">{getEmployeeName(employee)}</div>
                        <div className="text-xs text-slate-500">{employee.mobile || "No number"}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="text-sm text-slate-500">{weekLabel(weekStart)}</div>

      <div className="bg-white border rounded-[20px] p-4">
        {loading ? (
          <div className="p-4 text-slate-400">Loading...</div>
        ) : summaries.length === 0 ? (
          <div className="p-4 text-slate-400">No employees found for this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Employee</th>
                  {week.map((date) => (
                    <th key={date} className="min-w-[150px] px-4 py-3 text-left font-semibold text-slate-700">
                      <div>{parseLocalDate(date).toLocaleDateString(undefined, { weekday: "short" })}</div>
                      <div className="text-xs font-normal text-slate-400">{date}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Week Total</th>
                </tr>
              </thead>

              <tbody>
                {summaries.map(({ employee, days, totalHours }) => (
                  <tr key={employee.id} className="border-b align-top last:border-b-0">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{getEmployeeName(employee)}</div>
                      <div className="text-xs text-slate-500">{employee.email || "No email"}</div>
                    </td>

                    {days.map(({ date, attendance, hours }) => (
                      <td key={`${employee.id}_${date}`} className="px-4 py-4">
                        {!attendance ? (
                          <div className="text-slate-300">-</div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-medium text-slate-800">
                              {formatTime12(attendance.punch_in)} - {formatTime12(attendance.punch_out)}
                            </div>
                            <div className="text-xs text-slate-500">{hours.toFixed(2)} hrs</div>
                            {attendance.break_start && attendance.break_end ? (
                              <div className="text-xs text-slate-400">
                                Break: {formatTime12(attendance.break_start)} -{" "}
                                {formatTime12(attendance.break_end)}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>
                    ))}

                    <td className="px-4 py-4">
                      <div className="inline-flex rounded-xl bg-cyan-50 px-3 py-2 font-bold text-cyan-700">
                        {totalHours.toFixed(2)} hrs
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

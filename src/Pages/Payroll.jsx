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

function addDays(dateStr, days) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

function getEmployeeName(employee) {
  const firstName = employee?.first_name || ""
  const lastName = employee?.last_name || ""
  return `${firstName} ${lastName}`.trim() || employee?.name || "-"
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "CAD",
  }).format(Number(value || 0))
}

function formatHours(value) {
  return `${Number(value || 0).toFixed(2)} hrs`
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
    let breakStartMinutes = toMinutes(breakStart)
    let breakEndMinutes = toMinutes(breakEnd)
    if (breakEndMinutes < breakStartMinutes) breakEndMinutes += 24 * 60
    totalMinutes -= Math.max(0, breakEndMinutes - breakStartMinutes)
  }

  return Number((totalMinutes / 60).toFixed(2))
}

function periodLabel(startDate, endDate) {
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

export default function Payroll() {
  const [periodType, setPeriodType] = useState("weekly")
  const [periodStart, setPeriodStart] = useState(formatLocalDate(getMonday(new Date())))
  const [employees, setEmployees] = useState([])
  const [attendanceRows, setAttendanceRows] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all")
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const periodEnd = useMemo(
    () => addDays(periodStart, periodType === "biweekly" ? 13 : 6),
    [periodStart, periodType]
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [employeesRes, attendanceRes] = await Promise.all([
          employeesApi.listEmployees(),
          attendanceApi.getAttendance({ startDate: periodStart, endDate: periodEnd }),
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
  }, [periodStart, periodEnd])

  const activeEmployees = useMemo(() => {
    return employees.filter((employee) => String(employee.status || "").toLowerCase() === "active")
  }, [employees])

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase()
    const queryDigits = employeeSearch.replace(/\D/g, "")

    if (!query && !queryDigits) return activeEmployees

    return activeEmployees.filter((employee) => {
      const name = getEmployeeName(employee).toLowerCase()
      const mobileDigits = String(employee.mobile || "").replace(/\D/g, "")
      return name.includes(query) || (queryDigits && mobileDigits.includes(queryDigits))
    })
  }, [activeEmployees, employeeSearch])

  const selectedEmployeeLabel = useMemo(() => {
    if (selectedEmployeeId === "all") return "All Employees"
    const employee = activeEmployees.find((item) => String(item.id) === String(selectedEmployeeId))
    if (!employee) return "Select Employee"
    return `${getEmployeeName(employee)}${employee.mobile ? ` (${employee.mobile})` : ""}`
  }, [activeEmployees, selectedEmployeeId])

  const payrollRows = useMemo(() => {
    const totalsMap = {}

    for (const row of attendanceRows) {
      const key = String(row.employee_id)
      const hours = calculateWorkedHours(row.punch_in, row.punch_out, row.break_start, row.break_end)

      if (!totalsMap[key]) {
        totalsMap[key] = {
          workedDays: 0,
          hours: 0,
        }
      }

      totalsMap[key].workedDays += 1
      totalsMap[key].hours += hours
    }

    const visibleEmployees =
      selectedEmployeeId === "all"
        ? activeEmployees
        : activeEmployees.filter((employee) => String(employee.id) === String(selectedEmployeeId))

    return visibleEmployees
      .map((employee) => {
        const totals = totalsMap[String(employee.id)] || { workedDays: 0, hours: 0 }
        const hourlyRate = Number(employee.hourly_rate || 0)
        const hours = Number(totals.hours.toFixed(2))
        const grossPay = Number((hours * hourlyRate).toFixed(2))

        return {
          employee,
          workedDays: totals.workedDays,
          hours,
          hourlyRate,
          grossPay,
        }
      })
      .sort((a, b) => a.employee.first_name.localeCompare(b.employee.first_name))
  }, [attendanceRows, activeEmployees, selectedEmployeeId])

  const summary = useMemo(() => {
    return payrollRows.reduce(
      (totals, row) => {
        totals.employees += 1
        totals.hours += row.hours
        totals.grossPay += row.grossPay
        return totals
      },
      { employees: 0, hours: 0, grossPay: 0 }
    )
  }, [payrollRows])

  const goPrevPeriod = () => {
    setPeriodStart((prev) => addDays(prev, periodType === "biweekly" ? -14 : -7))
  }

  const goNextPeriod = () => {
    setPeriodStart((prev) => addDays(prev, periodType === "biweekly" ? 14 : 7))
  }

  const handlePeriodStart = (value) => {
    setPeriodStart(formatLocalDate(getMonday(value)))
  }

  const selectEmployee = (employeeId) => {
    setSelectedEmployeeId(employeeId)
    setEmployeeDropdownOpen(false)
    setEmployeeSearch("")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-2xl font-extrabold">Payroll</div>
            <div className="text-xs text-slate-400">
              Gross pay based on attendance hours and employee hourly rate.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPeriodType("weekly")}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold border",
                periodType === "weekly" ? "border-slate-900 bg-slate-900 text-white" : "bg-white",
              ].join(" ")}
            >
              Weekly
            </button>

            <button
              type="button"
              onClick={() => setPeriodType("biweekly")}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold border",
                periodType === "biweekly" ? "border-slate-900 bg-slate-900 text-white" : "bg-white",
              ].join(" ")}
            >
              Biweekly
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={goPrevPeriod} className="rounded-xl border px-3 py-2">
            Prev {periodType === "biweekly" ? "2 Weeks" : "Week"}
          </button>

          <input
            type="date"
            value={periodStart}
            onChange={(e) => handlePeriodStart(e.target.value)}
            className="rounded border p-2"
          />

          <button onClick={goNextPeriod} className="rounded-xl border px-3 py-2">
            Next {periodType === "biweekly" ? "2 Weeks" : "Week"}
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
              <span
                className={`ml-3 text-slate-400 transition-transform ${employeeDropdownOpen ? "rotate-180" : ""}`}
              >
                ^
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

      <div className="text-sm text-slate-500">
        {periodLabel(periodStart, periodEnd)} • {periodType === "biweekly" ? "Biweekly" : "Weekly"} payroll
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[20px] border bg-white p-4">
          <div className="text-xs text-slate-500">Employees</div>
          <div className="mt-2 text-2xl font-extrabold">{summary.employees}</div>
        </div>

        <div className="rounded-[20px] border bg-white p-4">
          <div className="text-xs text-slate-500">Total Worked Hours</div>
          <div className="mt-2 text-2xl font-extrabold">{formatHours(summary.hours)}</div>
        </div>

        <div className="rounded-[20px] border bg-white p-4">
          <div className="text-xs text-slate-500">Gross Payroll</div>
          <div className="mt-2 text-2xl font-extrabold text-cyan-700">{formatCurrency(summary.grossPay)}</div>
        </div>
      </div>

      <div className="rounded-[20px] border bg-white p-4">
        {loading ? (
          <div className="p-4 text-slate-400">Loading...</div>
        ) : payrollRows.length === 0 ? (
          <div className="p-4 text-slate-400">No payroll data found for this pay period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Mobile</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Worked Days</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Hours</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Hourly Rate</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Gross Pay</th>
                </tr>
              </thead>

              <tbody>
                {payrollRows.map((row) => (
                  <tr key={row.employee.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{getEmployeeName(row.employee)}</div>
                      <div className="text-xs text-slate-500">{row.employee.email || "No email"}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{row.employee.mobile || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{row.workedDays}</td>
                    <td className="px-4 py-4 font-medium text-slate-800">{formatHours(row.hours)}</td>
                    <td className="px-4 py-4 text-slate-600">{formatCurrency(row.hourlyRate)}</td>
                    <td className="px-4 py-4">
                      <div className="inline-flex rounded-xl bg-cyan-50 px-3 py-2 font-bold text-cyan-700">
                        {formatCurrency(row.grossPay)}
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

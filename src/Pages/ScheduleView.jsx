import { useEffect, useMemo, useState } from "react"
import scheduleApi from "../api/scheduleApi"
import employeesApi from "../api/employeesApi"
import ScheduleGrid from "../components/ScheduleGrid"

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function fmt(date) {
  return new Date(date).toISOString().slice(0, 10)
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return fmt(d)
}

function weekLabel(weekStart) {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

export default function ScheduleView() {
  const [weekStart, setWeekStart] = useState(fmt(getMonday(new Date())))
  const [employees, setEmployees] = useState([])
  const [schedulesMap, setSchedulesMap] = useState({})
  const [loading, setLoading] = useState(false)

  const week = useMemo(() => {
    const start = new Date(weekStart)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return fmt(d)
    })
  }, [weekStart])

  const load = async () => {
    setLoading(true)
    try {
      const [eRes, sRes] = await Promise.all([
        employeesApi.listEmployees(),
        scheduleApi.getSchedules({ weekStart }),
      ])

      const emps = eRes.data.employees || []
      const scheds = sRes.data.schedules || []

      const map = {}
      for (const s of scheds) {
        map[`${s.employee_id}_${s.work_date}`] = s
      }

      setEmployees(emps)
      setSchedulesMap(map)
    } catch (e) {
      console.error(e)
      setEmployees([])
      setSchedulesMap({})
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

  const downloadCsv = () => {
    const header = ["Employee", ...week]
    const activeEmployees = employees.filter((e) => String(e.status || "").toLowerCase() === "active")

    const rows = activeEmployees.map((emp) => {
      const name = `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
      const cells = week.map((date) => {
        const s = schedulesMap[`${emp.id}_${date}`]
        if (!s) return ""
        return `${s.start_time}-${s.end_time}${s.break_start && s.break_end ? ` | Break ${s.break_start}-${s.break_end}` : ""}${s.notes ? ` | ${s.notes}` : ""}`
      })
      return [name, ...cells]
    })

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `weekly_schedule_${weekStart}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeEmployees = employees.filter((e) => String(e.status || "").toLowerCase() === "active")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-extrabold">Schedule</div>
          <div className="text-xs text-slate-400">View weekly schedule</div>
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

          <button onClick={downloadCsv} className="px-3 py-2 rounded-xl border">
            Download Week
          </button>
        </div>
      </div>

      <div className="text-sm text-slate-500">{weekLabel(weekStart)}</div>

      <div className="bg-white border rounded-[20px] p-4">
        {loading ? (
          <div className="p-4 text-slate-400">Loading...</div>
        ) : (
          <ScheduleGrid
            employees={activeEmployees}
            week={week}
            schedules={schedulesMap}
            readOnly={true}
          />
        )}
      </div>
    </div>
  )
}
import { useEffect, useMemo, useState } from "react"
import scheduleApi from "../api/scheduleApi"
import employeesApi from "../api/employeesApi"
import ScheduleGrid from "../components/ScheduleGrid"

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

function normalizeDateOnly(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value)
  return formatLocalDate(new Date(value))
}

function weekLabel(weekStart) {
  const start = parseLocalDate(weekStart)
  const end = parseLocalDate(weekStart)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

export default function ScheduleView() {
  const [weekStart, setWeekStart] = useState(formatLocalDate(getMonday(new Date())))
  const [employees, setEmployees] = useState([])
  const [schedulesMap, setSchedulesMap] = useState({})
  const [loading, setLoading] = useState(false)

  const week = useMemo(() => {
    const start = parseLocalDate(weekStart)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return formatLocalDate(d)
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
      for (const raw of scheds) {
        const s = { ...raw, work_date: normalizeDateOnly(raw.work_date) }
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

  const handleWeekInput = (value) => {
    setWeekStart(formatLocalDate(getMonday(value)))
  }

  const downloadPdf = async () => {
    try {
      const res = await scheduleApi.downloadSchedulePdf(weekStart)
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `weekly_schedule_${weekStart}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Failed to download PDF")
    }
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

          <button onClick={downloadPdf} className="px-3 py-2 rounded-xl border">
            Download PDF
          </button>
        </div>
      </div>

      <div className="text-sm text-slate-500">{weekLabel(weekStart)}</div>

      <div className="bg-white border rounded-[20px] p-4">
        {loading ? (
          <div className="p-4 text-slate-400">Loading...</div>
        ) : (
          <ScheduleGrid employees={activeEmployees} week={week} schedules={schedulesMap} readOnly={true} />
        )}
      </div>
    </div>
  )
}
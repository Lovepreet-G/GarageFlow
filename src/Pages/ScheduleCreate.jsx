import { useEffect, useMemo, useState } from "react"
import scheduleApi from "../api/scheduleApi"
import employeesApi from "../api/employeesApi"
import ScheduleGrid from "../components/ScheduleGrid"
import ScheduleShiftModal from "../components/ScheduleShiftModal"

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

function isPastDate(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)

  return d < today
}

export default function ScheduleCreate() {
  const [weekStart, setWeekStart] = useState(fmt(getMonday(new Date())))
  const [copyWeekStart, setCopyWeekStart] = useState("")
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)

  const [originalMap, setOriginalMap] = useState({})
  const [scheduleMap, setScheduleMap] = useState({})
  const [drafts, setDrafts] = useState({})

  const [modal, setModal] = useState({
    open: false,
    employee: null,
    date: null,
    existing: null,
  })

  const week = useMemo(() => {
    const start = new Date(weekStart)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return fmt(d)
    })
  }, [weekStart])

  const activeEmployees = useMemo(
    () => employees.filter((e) => String(e.status || "").toLowerCase() === "active"),
    [employees]
  )

  const unsavedCount = useMemo(() => Object.keys(drafts).length, [drafts])

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
      setOriginalMap(map)
      setScheduleMap(map)
      setDrafts({})
    } catch (e) {
      console.error(e)
      setEmployees([])
      setOriginalMap({})
      setScheduleMap({})
      setDrafts({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [weekStart])

  const goPrevWeek = () => setWeekStart((prev) => addDays(prev, -7))
  const goNextWeek = () => setWeekStart((prev) => addDays(prev, 7))

  const handleWeekInput = (value) => {
    setWeekStart(fmt(getMonday(value)))
  }

  const openCell = (employee, date) => {
    if (isPastDate(date)) return

    const existing = scheduleMap[`${employee.id}_${date}`] || null
    setModal({ open: true, employee, date, existing })
  }

  const closeModal = () => {
    setModal({ open: false, employee: null, date: null, existing: null })
  }

  const saveShiftLocally = async (payload) => {
    if (isPastDate(payload.work_date)) {
      alert("Past dates cannot be updated")
      return
    }

    const key = `${payload.employee_id}_${payload.work_date}`
    const existing = scheduleMap[key] || null
    const original = originalMap[key] || null

    const nextShift = {
      ...(existing || {}),
      ...payload,
      id: existing?.id || original?.id || null,
      shop_id: existing?.shop_id || original?.shop_id || null,
      status: existing?.status || original?.status || "scheduled",
    }

    setScheduleMap((prev) => ({ ...prev, [key]: nextShift }))

    setDrafts((prev) => {
      const copy = { ...prev }
      if (original) {
        copy[key] = {
          action: "update",
          id: original.id,
          payload: {
            start_time: payload.start_time,
            end_time: payload.end_time,
            break_start: payload.break_start || null,
            break_end: payload.break_end || null,
            notes: payload.notes || null,
            status: payload.status || original.status || "scheduled",
          },
        }
      } else {
        copy[key] = {
          action: "create",
          payload: {
            employee_id: payload.employee_id,
            work_date: payload.work_date,
            start_time: payload.start_time,
            end_time: payload.end_time,
            break_start: payload.break_start || null,
            break_end: payload.break_end || null,
            notes: payload.notes || null,
          },
        }
      }
      return copy
    })

    closeModal()
  }

  const deleteShiftLocally = async () => {
    const { employee, date } = modal
    if (!employee || !date) return
    if (isPastDate(date)) {
      alert("Past dates cannot be updated")
      return
    }

    const key = `${employee.id}_${date}`
    const original = originalMap[key] || null

    setScheduleMap((prev) => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })

    setDrafts((prev) => {
      const copy = { ...prev }
      if (original) {
        copy[key] = { action: "delete", id: original.id }
      } else {
        delete copy[key]
      }
      return copy
    })

    closeModal()
  }

  const copyFromSelectedWeek = async () => {
    if (!copyWeekStart) {
      alert("Please select a week to copy from")
      return
    }

    const normalizedCopyWeek = fmt(getMonday(copyWeekStart))

    if (normalizedCopyWeek >= weekStart) {
      alert("You can only copy from a previous week")
      return
    }

    try {
      const res = await scheduleApi.getSchedules({ weekStart: normalizedCopyWeek })
      const sourceSchedules = res.data.schedules || []

      setScheduleMap((prevMap) => {
        const nextMap = { ...prevMap }

        setDrafts((prevDrafts) => {
          const nextDrafts = { ...prevDrafts }

          for (const s of sourceSchedules) {
            const emp = activeEmployees.find((e) => String(e.id) === String(s.employee_id))
            if (!emp) continue

            const sourceMonday = new Date(normalizedCopyWeek)
            const sourceDate = new Date(s.work_date)
            const dayOffset = Math.round((sourceDate - sourceMonday) / (1000 * 60 * 60 * 24))

            const targetDate = addDays(weekStart, dayOffset)
            if (isPastDate(targetDate)) continue

            const key = `${s.employee_id}_${targetDate}`
            const original = originalMap[key] || null

            const copiedShift = {
              ...s,
              work_date: targetDate,
              id: original?.id || null,
            }

            nextMap[key] = copiedShift

            if (original) {
              nextDrafts[key] = {
                action: "update",
                id: original.id,
                payload: {
                  start_time: s.start_time,
                  end_time: s.end_time,
                  break_start: s.break_start || null,
                  break_end: s.break_end || null,
                  notes: s.notes || null,
                  status: s.status || "scheduled",
                },
              }
            } else {
              nextDrafts[key] = {
                action: "create",
                payload: {
                  employee_id: s.employee_id,
                  work_date: targetDate,
                  start_time: s.start_time,
                  end_time: s.end_time,
                  break_start: s.break_start || null,
                  break_end: s.break_end || null,
                  notes: s.notes || null,
                },
              }
            }
          }

          return nextDrafts
        })

        return nextMap
      })
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Failed to copy selected week")
    }
  }

  const saveAll = async () => {
    if (!unsavedCount) return

    try {
      setLoading(true)

      for (const draft of Object.values(drafts)) {
        if (draft.action === "create") {
          await scheduleApi.createSchedule(draft.payload)
        } else if (draft.action === "update") {
          await scheduleApi.updateSchedule(draft.id, draft.payload)
        } else if (draft.action === "delete") {
          await scheduleApi.deleteSchedule(draft.id)
        }
      }

      await load()
    } catch (e) {
      console.error(e)
      alert(e?.response?.data?.message || "Failed to save weekly schedule")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-extrabold">Create Schedule</div>
          <div className="text-xs text-slate-400">
            Week starts Monday • Only active employees are shown • Past dates are locked
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

          <input
            type="date"
            value={copyWeekStart}
            onChange={(e) => setCopyWeekStart(e.target.value)}
            className="border p-2 rounded"
            title="Select any previous week to copy from"
          />

          <button onClick={copyFromSelectedWeek} className="px-3 py-2 rounded-xl border">
            Copy From Week
          </button>

          <button
            onClick={saveAll}
            disabled={!unsavedCount || loading}
            className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold disabled:opacity-50"
          >
            {loading ? "Saving..." : `Save Schedule${unsavedCount ? ` (${unsavedCount})` : ""}`}
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
            schedules={scheduleMap}
            onCellClick={openCell}
            isCellLocked={(_, date) => isPastDate(date)}
          />
        )}
      </div>

      <ScheduleShiftModal
        open={modal.open}
        onClose={closeModal}
        date={modal.date}
        employee={modal.employee || {}}
        existing={modal.existing}
        onSave={saveShiftLocally}
        onDelete={deleteShiftLocally}
        readOnly={modal.date ? isPastDate(modal.date) : false}
      />
    </div>
  )
}
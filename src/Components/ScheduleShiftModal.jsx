import { useEffect, useState } from "react"

function fullName(emp) {
  const fn = emp?.first_name || ""
  const ln = emp?.last_name || ""
  const name = `${fn} ${ln}`.trim()
  return name || emp?.name || "Employee"
}

export default function ScheduleShiftModal({
  open,
  onClose,
  date,
  employee,
  existing,
  onSave,
  onDelete,
}) {
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [breakStart, setBreakStart] = useState("")
  const [breakEnd, setBreakEnd] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!open) return
    setStart(existing?.start_time || "")
    setEnd(existing?.end_time || "")
    setBreakStart(existing?.break_start || "")
    setBreakEnd(existing?.break_end || "")
    setNotes(existing?.notes || "")
  }, [open, existing])

  if (!open) return null

  const close = () => onClose && onClose()

  const validate = () => {
    if (!start || !end) return "Start and end are required"
    if (end <= start) return "End must be after start"

    // break is optional, but if one is set, both must be set
    if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
      return "Break start and break end must both be set"
    }
    if (breakStart && breakEnd) {
      if (breakEnd <= breakStart) return "Break end must be after break start"
      if (breakStart < start || breakEnd > end) return "Break must be inside the shift time"
    }
    return null
  }

  const save = () => {
    const err = validate()
    if (err) return alert(err)

    if (typeof onSave !== "function") return

    onSave({
      employee_id: employee?.id,
      work_date: date,
      start_time: start,
      end_time: end,
      break_start: breakStart || null,
      break_end: breakEnd || null,
      notes: notes?.trim() || null,
    })
  }

  const del = () => {
    if (!existing?.id || typeof onDelete !== "function") return
    const ok = window.confirm("Delete this shift?")
    if (!ok) return
    onDelete(existing.id)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onMouseDown={(e) => {
      if (e.target === e.currentTarget) close()
    }}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">
          Shift — {fullName(employee)} — {date}
        </h3>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs">Start</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="text-xs">End</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="text-xs">Break start (optional)</label>
            <input
              type="time"
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="text-xs">Break end (optional)</label>
            <input
              type="time"
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs">Notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Notes…"
          />
        </div>

        <div className="mt-4 flex justify-between gap-2">
          <div>
            {existing ? (
              <button onClick={del} className="px-3 py-2 rounded-xl border">
                Delete
              </button>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={close} className="px-3 py-2 rounded-xl border">
              Cancel
            </button>
            <button onClick={save} className="px-3 py-2 rounded-xl bg-cyan-600 text-white">
              Save
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 mt-3">
          Punch in/out is not manual — attendance will be generated automatically from this schedule.
        </div>
      </div>
    </div>
  )
}

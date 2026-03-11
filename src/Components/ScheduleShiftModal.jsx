import { useEffect, useState } from "react"

function fullName(emp) {
  const fn = emp?.first_name || ""
  const ln = emp?.last_name || ""
  return `${fn} ${ln}`.trim() || emp?.name || "Employee"
}

export default function ScheduleShiftModal({
  open,
  onClose,
  date,
  employee,
  existing,
  onSave,
  onDelete,
  readOnly = false,
}) {
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [breakStart, setBreakStart] = useState("")
  const [breakEnd, setBreakEnd] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setStart(existing?.start_time || "")
    setEnd(existing?.end_time || "")
    setBreakStart(existing?.break_start || "")
    setBreakEnd(existing?.break_end || "")
    setNotes(existing?.notes || "")
    setError("")
  }, [open, existing])

  if (!open) return null

  const validate = () => {
    if (!start || !end) return "Start and end are required"
    if (end <= start) return "End must be after start"

    if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
      return "Break start and break end must both be set"
    }

    if (breakStart && breakEnd) {
      if (breakEnd <= breakStart) return "Break end must be after break start"
      if (breakStart < start || breakEnd > end) return "Break must be inside the shift"
    }

    return null
  }

  const handleSave = () => {
    if (readOnly) return

    const err = validate()
    if (err) {
      setError(err)
      return
    }

    onSave?.({
      employee_id: employee?.id,
      work_date: date,
      start_time: start,
      end_time: end,
      break_start: breakStart || null,
      break_end: breakEnd || null,
      notes: notes?.trim() || null,
    })
  }

  const handleDelete = () => {
    if (readOnly || !existing) return
    const ok = window.confirm("Remove this shift?")
    if (!ok) return
    onDelete?.() // ✅ important: parent handles current modal employee/date
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
        <h3 className="text-lg font-bold">
          Shift — {fullName(employee)} — {date}
        </h3>

        {readOnly ? (
          <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Past dates are locked and cannot be edited.
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="text-xs text-slate-500">Start</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border p-2 rounded w-full"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">End</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border p-2 rounded w-full"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Break start</label>
            <input
              type="time"
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
              className="border p-2 rounded w-full"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Break end</label>
            <input
              type="time"
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              className="border p-2 rounded w-full"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-xs text-slate-500">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Notes…"
            disabled={readOnly}
          />
        </div>

        <div className="mt-4 flex justify-between gap-2">
          <div>
            {existing ? (
              <button
                onClick={handleDelete}
                disabled={readOnly}
                className="px-3 py-2 rounded-xl border disabled:opacity-50"
              >
                Delete
              </button>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded-xl border">
              {readOnly ? "Close" : "Cancel"}
            </button>
            {!readOnly ? (
              <button onClick={handleSave} className="px-3 py-2 rounded-xl bg-cyan-600 text-white">
                Save
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
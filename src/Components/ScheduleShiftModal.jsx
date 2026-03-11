import { useEffect, useMemo, useState } from "react"

function fullName(emp) {
  const fn = emp?.first_name || ""
  const ln = emp?.last_name || ""
  const name = `${fn} ${ln}`.trim()
  return name || emp?.name || "Employee"
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

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

function TimePicker({ label, value, onChange, disabled = false }) {
  const parts = useMemo(() => to12Parts(value), [value])

  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <div className="grid grid-cols-3 gap-2 mt-1">
        <select
          value={parts.hour}
          onChange={(e) => onChange(to24Hour(e.target.value, parts.minute, parts.ampm))}
          className="border p-2 rounded w-full"
          disabled={disabled}
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
          className="border p-2 rounded w-full"
          disabled={disabled}
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
          className="border p-2 rounded w-full"
          disabled={disabled}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
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

  const close = () => onClose && onClose()

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

  const save = () => {
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

  const del = () => {
    if (readOnly || !existing) return
    const ok = window.confirm("Delete this shift?")
    if (!ok) return
    onDelete?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl" onMouseDown={(e) => e.stopPropagation()}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <TimePicker label="Start" value={start} onChange={setStart} disabled={readOnly} />
          <TimePicker label="End" value={end} onChange={setEnd} disabled={readOnly} />
          <TimePicker label="Break start (optional)" value={breakStart} onChange={setBreakStart} disabled={readOnly} />
          <TimePicker label="Break end (optional)" value={breakEnd} onChange={setBreakEnd} disabled={readOnly} />
        </div>

        <div className="mt-3">
          <label className="text-xs text-slate-500">Notes (optional)</label>
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
              <button onClick={del} disabled={readOnly} className="px-3 py-2 rounded-xl border disabled:opacity-50">
                Delete
              </button>
            ) : null}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={close} className="px-3 py-2 rounded-xl border">
              {readOnly ? "Close" : "Cancel"}
            </button>
            {!readOnly ? (
              <button onClick={save} className="px-3 py-2 rounded-xl bg-cyan-600 text-white">
                Save
              </button>
            ) : null}
          </div>
        </div>

        <div className="text-xs text-slate-400 mt-3">
          Times are entered in 12-hour AM/PM format
        </div>
      </div>
    </div>
  )
}
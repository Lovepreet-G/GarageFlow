import { useMemo } from "react"

function dayLabel(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`)
  const day = d.toLocaleDateString(undefined, { weekday: "short" })
  const md = d.toLocaleDateString(undefined, { month: "short", day: "2-digit" })
  return { day, md }
}

function fullName(emp) {
  const fn = emp?.first_name || ""
  const ln = emp?.last_name || ""
  const name = `${fn} ${ln}`.trim()
  return name || emp?.name || `#${emp?.id ?? "—"}`
}

function formatTime12(value) {
  if (!value) return ""
  const [rawH = "0", rawM = "00"] = String(value).split(":")
  let h = Number(rawH)
  const m = String(rawM).padStart(2, "0")
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m} ${ampm}`
}

function calculateShiftHours(startTime, endTime, breakStart, breakEnd) {
  if (!startTime || !endTime) return 0

  const toMinutes = (value) => {
    const [hour, minute] = String(value).split(":").map(Number)
    return hour * 60 + minute
  }

  let start = toMinutes(startTime)
  let end = toMinutes(endTime)
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

export default function ScheduleGrid({
  employees = [],
  week = [],
  schedules = {},
  readOnly = false,
  onCellClick,
  isCellLocked,
}) {
  const todayIso = new Date().toISOString().slice(0, 10)
  const weekMeta = useMemo(() => week.map((d) => ({ date: d, ...dayLabel(d) })), [week])

  const cellLocked = (emp, date) => {
    if (typeof isCellLocked === "function") return Boolean(isCellLocked(emp, date))
    return false
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-separate border-spacing-0">
        <thead className="bg-slate-50 text-slate-500 text-xs">
          <tr>
            <th className="p-2 sticky left-0 bg-slate-50 z-10 text-left min-w-[180px]">Employee</th>
            {weekMeta.map((w) => (
              <th
                key={w.date}
                className={[
                  "p-2 text-left whitespace-nowrap min-w-[170px]",
                  w.date === todayIso ? "bg-cyan-50" : "",
                ].join(" ")}
              >
                <div className="font-semibold text-slate-700">{w.day}</div>
                <div className="text-[11px]">{w.md}</div>
              </th>
            ))}
            <th className="p-2 text-left whitespace-nowrap min-w-[120px]">
              <div className="font-semibold text-slate-700">Total</div>
              <div className="text-[11px]">Week Hours</div>
            </th>
          </tr>
        </thead>

        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan={week.length + 2} className="p-4 text-slate-400">
                No employees
              </td>
            </tr>
          ) : (
            employees.map((emp) => {
              const inactive = String(emp?.status || "").toLowerCase() === "inactive"
              const weeklyTotal = week.reduce((sum, date) => {
                const schedule = schedules[`${emp.id}_${date}`]
                if (!schedule) return sum

                return (
                  sum +
                  calculateShiftHours(
                    schedule.start_time,
                    schedule.end_time,
                    schedule.break_start,
                    schedule.break_end
                  )
                )
              }, 0)

              return (
                <tr key={emp.id} className="border-t">
                  <td
                    className={[
                      "p-2 font-semibold sticky left-0 z-10 bg-white border-r",
                      inactive ? "text-slate-400" : "",
                    ].join(" ")}
                    title={inactive ? "Inactive employee" : ""}
                  >
                    {fullName(emp)}
                  </td>

                  {week.map((d) => {
                    const key = `${emp.id}_${d}`
                    const s = schedules[key]
                    const locked = cellLocked(emp, d)
                    const clickable = !readOnly && !inactive && !locked && typeof onCellClick === "function"

                    return (
                      <td
                        key={d}
                        className={[
                          "p-2 align-top",
                          d === todayIso ? "bg-cyan-50/40" : "",
                          locked ? "bg-slate-100" : "",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          disabled={!clickable}
                          onClick={() => clickable && onCellClick(emp, d)}
                          className={[
                            "w-full text-left min-h-[60px] rounded-lg px-2 py-2 border transition",
                            clickable ? "hover:bg-slate-50 cursor-pointer" : "cursor-default",
                            s ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-white",
                            inactive ? "opacity-60" : "",
                            locked ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "",
                          ].join(" ")}
                          title={
                            readOnly
                              ? "View only"
                              : inactive
                                ? "Inactive employee"
                                : locked
                                  ? "Past dates cannot be edited"
                                  : "Click to set shift"
                          }
                        >
                          {s ? (
                            <>
                              <div className="font-semibold">
                                {formatTime12(s.start_time)} - {formatTime12(s.end_time)}
                              </div>

                              {s?.break_start && s?.break_end ? (
                                <div className="text-xs text-slate-500 mt-1">
                                  Break: {formatTime12(s.break_start)} - {formatTime12(s.break_end)}
                                </div>
                              ) : null}

                              {s?.notes ? (
                                <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {s.notes}
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <div className="text-slate-400">{locked ? "Locked" : "—"}</div>
                          )}
                        </button>
                      </td>
                    )
                  })}

                  <td className="p-2 align-top">
                    <div className="min-h-[60px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="font-semibold text-slate-800">{weeklyTotal.toFixed(2)} hrs</div>
                      <div className="mt-1 text-xs text-slate-500">Scheduled total</div>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {!readOnly ? (
        <div className="text-xs text-slate-400 mt-2">
          Tip: Click a cell to set shift timing. Times are shown in 12-hour AM/PM format.
        </div>
      ) : null}
    </div>
  )
}

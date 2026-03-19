import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import payrollApi from "../api/payrollApi"

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

function getNormalizedStartDate(periodType, value) {
  if (periodType === "monthly") {
    const date = parseLocalDate(value)
    return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  return formatLocalDate(getMonday(value))
}

function addDays(dateStr, days) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

function addMonths(dateStr, months) {
  const date = parseLocalDate(dateStr)
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth() + months, 1))
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

function periodLabel(startDate, endDate) {
  if (!startDate || !endDate) return ""
  return `${parseLocalDate(startDate).toLocaleDateString()} - ${parseLocalDate(endDate).toLocaleDateString()}`
}

function TinyBarChart({ title, data, valueKey, colorClass }) {
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 0)

  return (
    <div className="rounded-[20px] border bg-white p-4">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      <div className="mt-4 flex h-56 items-end gap-3 overflow-x-auto">
        {data.length === 0 ? (
          <div className="text-sm text-slate-400">No weekly payroll history yet.</div>
        ) : (
          data.map((item) => {
            const value = Number(item[valueKey] || 0)
            const height = maxValue > 0 ? Math.max((value / maxValue) * 100, 8) : 8

            return (
              <div key={`${title}_${item.start_date}`} className="flex min-w-[64px] flex-col items-center gap-2">
                <div className="text-[11px] font-semibold text-slate-500">
                  {valueKey.includes("pay") ? formatCurrency(value) : formatHours(value)}
                </div>
                <div className="flex h-40 items-end">
                  <div
                    className={`w-10 rounded-t-2xl ${colorClass}`}
                    style={{ height: `${height}%` }}
                    title={`${item.start_date} to ${item.end_date}`}
                  />
                </div>
                <div className="text-center text-[11px] text-slate-400">{item.start_date}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function TinyLineChart({ title, data, valueKey }) {
  const chartData = data.slice(-8)
  const maxValue = Math.max(...chartData.map((item) => Number(item[valueKey] || 0)), 0)
  const points = chartData.map((item, index) => {
    const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100
    const y = maxValue > 0 ? 100 - (Number(item[valueKey] || 0) / maxValue) * 90 : 100
    return `${x},${y}`
  })

  return (
    <div className="rounded-[20px] border bg-white p-4">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      {chartData.length === 0 ? (
        <div className="mt-4 text-sm text-slate-400">No weekly payroll history yet.</div>
      ) : (
        <>
          <div className="mt-4 h-56 rounded-2xl bg-slate-50 p-3">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <polyline fill="none" stroke="#0f172a" strokeWidth="2.5" points={points.join(" ")} />
              {chartData.map((item, index) => {
                const x = chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100
                const y = maxValue > 0 ? 100 - (Number(item[valueKey] || 0) / maxValue) * 90 : 100
                return <circle key={`${item.start_date}_${index}`} cx={x} cy={y} r="2.8" fill="#06b6d4" />
              })}
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
            {chartData.map((item) => (
              <div key={`${title}_${item.start_date}`}>
                {item.start_date}: {valueKey.includes("pay") ? formatCurrency(item[valueKey]) : formatHours(item[valueKey])}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function PayrollEmployeeHistory() {
  const navigate = useNavigate()
  const { employeeId } = useParams()
  const [periodType, setPeriodType] = useState("weekly")
  const [periodStart, setPeriodStart] = useState(formatLocalDate(getMonday(new Date())))
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [historyData, setHistoryData] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [previewRes, historyRes] = await Promise.all([
        payrollApi.getSummary({ periodType, startDate: periodStart, employeeId }),
        payrollApi.getEmployeeHistory(employeeId, { periodType: "weekly" }),
      ])

      setPreviewData(previewRes.data)
      setHistoryData(historyRes.data)
    } catch (error) {
      console.error(error)
      setPreviewData(null)
      setHistoryData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [employeeId, periodType, periodStart])

  const employee = previewData?.rows?.[0] || historyData?.employee || null
  const previewRow = previewData?.rows?.[0] || null
  const previewRun = previewData?.payroll_run || null
  const weeklyHistory = historyData?.history || []
  const weeklyChartPoints = historyData?.analytics?.chart_points || []
  const weeklySummary = historyData?.analytics?.summary || {
    periods: 0,
    worked_hours: 0,
    gross_pay: 0,
    bonus_amount: 0,
    penalty_amount: 0,
    manual_adjustment: 0,
    final_pay: 0,
  }

  const latestWeeklyPeriod = useMemo(() => weeklyHistory[0] || null, [weeklyHistory])

  const goPrevPeriod = () => {
    setPeriodStart((prev) =>
      periodType === "monthly" ? addMonths(prev, -1) : addDays(prev, periodType === "biweekly" ? -14 : -7)
    )
  }

  const goNextPeriod = () => {
    setPeriodStart((prev) =>
      periodType === "monthly" ? addMonths(prev, 1) : addDays(prev, periodType === "biweekly" ? 14 : 7)
    )
  }

  const handlePeriodTypeChange = (nextType) => {
    setPeriodType(nextType)
    setPeriodStart((prev) => getNormalizedStartDate(nextType, prev))
  }

  const handlePeriodStart = (value) => {
    setPeriodStart(getNormalizedStartDate(periodType, value))
  }

  const downloadCurrentPdf = async () => {
    try {
      const res = await payrollApi.downloadEmployeePdf(employeeId, { periodType, startDate: periodStart })
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `employee_payroll_${employeeId}_${periodStart}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || "Failed to download employee payroll PDF")
    }
  }

  const downloadWeeklyPdf = async (startDate) => {
    try {
      const res = await payrollApi.downloadEmployeePdf(employeeId, { periodType: "weekly", startDate })
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `employee_payroll_${employeeId}_${startDate}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || "Failed to download employee payroll PDF")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button onClick={() => navigate("/payroll")} className="text-sm text-slate-500 hover:underline">
            Back to Payroll
          </button>
          <div className="mt-2 text-2xl font-extrabold">
            {employee?.employee_name || historyData?.employee?.employee_name || "Employee Payroll History"}
          </div>
          <div className="text-xs text-slate-400">
            Navigate weekly, biweekly, or monthly employee payroll preview while keeping weekly finalized history below.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["weekly", "biweekly", "monthly"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handlePeriodTypeChange(type)}
              className={[
                "rounded-xl border px-4 py-2 text-sm font-semibold",
                periodType === type ? "border-slate-900 bg-slate-900 text-white" : "bg-white",
              ].join(" ")}
            >
              {type === "biweekly" ? "Biweekly" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}

          <button onClick={downloadCurrentPdf} className="rounded-xl border px-3 py-2">
            Download Current PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={goPrevPeriod} className="rounded-xl border px-3 py-2">
          Prev {periodType === "monthly" ? "Month" : periodType === "biweekly" ? "2 Weeks" : "Week"}
        </button>

        <input
          type="date"
          value={periodStart}
          onChange={(e) => handlePeriodStart(e.target.value)}
          className="rounded border p-2"
        />

        <button onClick={goNextPeriod} className="rounded-xl border px-3 py-2">
          Next {periodType === "monthly" ? "Month" : periodType === "biweekly" ? "2 Weeks" : "Week"}
        </button>
      </div>

      {loading ? (
        <div className="rounded-[20px] border bg-white p-6 text-slate-400">Loading...</div>
      ) : !employee ? (
        <div className="rounded-[20px] border bg-white p-6 text-slate-400">No payroll history found.</div>
      ) : (
        <>
          <div className="rounded-[20px] border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">Current Period Preview</div>
                <div className="text-xs text-slate-500">
                  {previewData?.period ? periodLabel(previewData.period.start_date, previewData.period.end_date) : ""}
                </div>
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {periodType}
              </div>
            </div>

            {previewRow ? (
              <div className="overflow-x-auto rounded-[24px] border bg-white">
                <div className="flex min-w-[960px] items-stretch">
                  {[
                    { label: "Worked Days", value: previewRow.worked_days },
                    { label: "Worked Hours", value: formatHours(previewRow.worked_hours) },
                    { label: "Gross Pay", value: formatCurrency(previewRow.gross_pay) },
                    { label: "Final Pay", value: formatCurrency(previewRow.final_pay), tone: "text-cyan-700" },
                    { label: "Status", value: previewRun?.status || "preview" },
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      className={[
                        "flex-1 px-5 py-4",
                        index !== 4 ? "border-r border-slate-200" : "",
                      ].join(" ")}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {item.label}
                      </div>
                      <div className={`mt-2 text-2xl font-extrabold ${item.tone || "text-slate-900"}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">No payroll preview data for this selected period.</div>
            )}
          </div>

          <div className="rounded-[20px] border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
            Weekly payroll history, charts, and history table stay weekly because weekly is the only finalized payroll source. The top preview section above changes with your selected weekly, biweekly, or monthly period.
          </div>

          <div className="overflow-x-auto rounded-[24px] border bg-white">
            <div className="flex min-w-[960px] items-stretch">
              {[
                { label: "Saved Weekly Periods", value: weeklySummary.periods },
                { label: "Worked Hours", value: formatHours(weeklySummary.worked_hours) },
                { label: "Gross Pay", value: formatCurrency(weeklySummary.gross_pay) },
                { label: "Final Pay", value: formatCurrency(weeklySummary.final_pay), tone: "text-cyan-700" },
                { label: "Bonuses", value: formatCurrency(weeklySummary.bonus_amount) },
                { label: "Penalties", value: formatCurrency(weeklySummary.penalty_amount) },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={[
                    "flex-1 px-5 py-4",
                    index !== 5 ? "border-r border-slate-200" : "",
                  ].join(" ")}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.label}
                  </div>
                  <div className={`mt-2 text-2xl font-extrabold ${item.tone || "text-slate-900"}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <TinyBarChart title="Weekly Final Pay Trend" data={weeklyChartPoints} valueKey="final_pay" colorClass="bg-cyan-500" />
            <TinyBarChart title="Weekly Hours Trend" data={weeklyChartPoints} valueKey="worked_hours" colorClass="bg-slate-900" />
            <TinyLineChart title="Weekly Gross Pay Trend" data={weeklyChartPoints} valueKey="gross_pay" />
          </div>

          <div className="rounded-[20px] border bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">Weekly Payroll History</div>
                <div className="text-xs text-slate-500">Saved finalized or paid weekly payroll runs for this employee.</div>
              </div>
              {latestWeeklyPeriod ? (
                <button onClick={() => downloadWeeklyPdf(latestWeeklyPeriod.start_date)} className="rounded-xl border px-3 py-2 text-sm font-semibold">
                  Download Latest Weekly PDF
                </button>
              ) : null}
            </div>

            {weeklyHistory.length === 0 ? (
              <div className="p-4 text-slate-400">No saved weekly payroll history yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Period</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Hours</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Gross</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Bonus</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Penalty</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Adjustment</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Final</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Statement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyHistory.map((row) => (
                      <tr key={row.payroll_run_id} className="border-b last:border-b-0">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">{row.start_date} to {row.end_date}</div>
                          <div className="text-xs text-slate-500">{row.notes || "No notes"}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                              row.status === "paid"
                                ? "bg-cyan-50 text-cyan-700"
                                : row.status === "finalized"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">{formatHours(row.worked_hours)}</td>
                        <td className="px-4 py-4">{formatCurrency(row.gross_pay)}</td>
                        <td className="px-4 py-4">{formatCurrency(row.bonus_amount)}</td>
                        <td className="px-4 py-4">{formatCurrency(row.penalty_amount)}</td>
                        <td className="px-4 py-4">{formatCurrency(row.manual_adjustment)}</td>
                        <td className="px-4 py-4 font-bold text-cyan-700">{formatCurrency(row.final_pay)}</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => downloadWeeklyPdf(row.start_date)}
                            className="rounded-xl border px-3 py-2 text-xs font-semibold"
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

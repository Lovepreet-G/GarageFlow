import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
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
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function formatHours(value) {
  return `${Number(value || 0).toFixed(2)} hrs`
}

function periodLabel(startDate, endDate) {
  if (!startDate || !endDate) return ""
  return `${parseLocalDate(startDate).toLocaleDateString()} - ${parseLocalDate(endDate).toLocaleDateString()}`
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-base font-bold text-slate-900">{title}</div>
      {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
      <div className="mt-4 h-72">{children}</div>
    </div>
  )
}

function StatStrip({ items }) {
  return (
    <div className="overflow-x-auto rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div className="flex min-w-[860px]">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={[
              "flex-1 px-5 py-5",
              index !== items.length - 1 ? "border-r border-slate-200" : "",
            ].join(" ")}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {item.label}
            </div>
            <div className={`mt-2 text-2xl font-extrabold ${item.tone || "text-slate-900"}`}>{item.value}</div>
            {item.subtext ? <div className="mt-1 text-xs text-slate-500">{item.subtext}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-slate-800">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="mt-1 text-slate-600">
          {entry.name}: {entry.dataKey.includes("hours") ? formatHours(entry.value) : formatCurrency(entry.value)}
        </div>
      ))}
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
  const [downloadingKey, setDownloadingKey] = useState("")

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
      setDownloadingKey(`current-${periodType}-${periodStart}`)
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
    } finally {
      setDownloadingKey("")
    }
  }

  const downloadWeeklyPdf = async (startDate) => {
    try {
      setDownloadingKey(`weekly-${startDate}`)
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
    } finally {
      setDownloadingKey("")
    }
  }

  const chartData = weeklyChartPoints.map((item) => ({
    period: item.start_date,
    final_pay: Number(item.final_pay || 0),
    gross_pay: Number(item.gross_pay || 0),
    worked_hours: Number(item.worked_hours || 0),
  }))

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <button onClick={() => navigate("/payroll")} className="text-sm text-slate-500 hover:underline">
              Back to Payroll
            </button>
            <div className="text-3xl font-black tracking-tight text-slate-900">
              {employee?.employee_name || historyData?.employee?.employee_name || "Employee Payroll"}
            </div>
            <div className="max-w-2xl text-sm text-slate-500">
              Review this employee’s current payroll preview by period and keep weekly saved payroll history available below.
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <span>{previewData?.period ? periodLabel(previewData.period.start_date, previewData.period.end_date) : ""}</span>
              <span>{periodType}</span>
              <span>Status: {previewRun?.status || "preview"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {["weekly", "biweekly", "monthly"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handlePeriodTypeChange(type)}
                className={[
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  periodType === type
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
                ].join(" ")}
              >
                {type === "biweekly" ? "Biweekly" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}

            <button
              onClick={downloadCurrentPdf}
              disabled={Boolean(downloadingKey)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloadingKey === `current-${periodType}-${periodStart}` ? "Downloading..." : "Download Current PDF"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button onClick={goPrevPeriod} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Prev {periodType === "monthly" ? "Month" : periodType === "biweekly" ? "2 Weeks" : "Week"}
          </button>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => handlePeriodStart(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <button onClick={goNextPeriod} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Next {periodType === "monthly" ? "Month" : periodType === "biweekly" ? "2 Weeks" : "Week"}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-slate-400 shadow-sm">Loading...</div>
      ) : !employee ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-slate-400 shadow-sm">No payroll history found.</div>
      ) : (
        <>
          <StatStrip
            items={[
              { label: "Worked Days", value: previewRow?.worked_days ?? "-" },
              { label: "Worked Hours", value: previewRow ? formatHours(previewRow.worked_hours) : "-" },
              { label: "Gross Pay", value: previewRow ? formatCurrency(previewRow.gross_pay) : "-" },
              { label: "Final Pay", value: previewRow ? formatCurrency(previewRow.final_pay) : "-", tone: "text-cyan-700" },
              { label: "Status", value: previewRun?.status || "preview" },
            ]}
          />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <ChartCard title="Weekly Final Pay Trend" subtitle="Saved weekly payroll only.">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No weekly payroll history yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Bar dataKey="final_pay" name="Final Pay" fill="#06b6d4" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Weekly Hours Trend" subtitle="Worked hours from saved weekly payroll.">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No weekly payroll history yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Bar dataKey="worked_hours" name="Worked Hours" fill="#0f172a" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Weekly Gross vs Final" subtitle="Trend line from saved weekly payroll.">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No weekly payroll history yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="gross_pay" name="Gross Pay" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="final_pay" name="Final Pay" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-900">Weekly Payroll History</div>
                <div className="mt-1 text-xs text-slate-500">Saved finalized or paid weekly payroll runs for this employee.</div>
              </div>
              {latestWeeklyPeriod ? (
                <button
                  onClick={() => downloadWeeklyPdf(latestWeeklyPeriod.start_date)}
                  disabled={Boolean(downloadingKey)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingKey === `weekly-${latestWeeklyPeriod.start_date}` ? "Downloading..." : "Download Latest Weekly PDF"}
                </button>
              ) : null}
            </div>

            {weeklyHistory.length === 0 ? (
              <div className="text-sm text-slate-400">No saved weekly payroll history yet.</div>
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
                      <tr key={row.payroll_run_id} className="border-b align-top last:border-b-0">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">{row.start_date} to {row.end_date}</div>
                          <div className="mt-1 text-xs text-slate-500">{row.notes || "No notes"}</div>
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
                            disabled={Boolean(downloadingKey)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {downloadingKey === `weekly-${row.start_date}` ? "Downloading..." : "PDF"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

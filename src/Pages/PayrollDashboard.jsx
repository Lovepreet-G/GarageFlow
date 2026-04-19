import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

function addDays(dateStr, days) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
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

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-base font-bold text-slate-900">{title}</div>
      {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
      <div className="mt-4 h-72">{children}</div>
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

function StatCard({ label, value, subtext, tone = "text-slate-900" }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className={`mt-3 text-3xl font-extrabold ${tone}`}>{value}</div>
      {subtext ? <div className="mt-2 text-sm text-slate-500">{subtext}</div> : null}
    </div>
  )
}

export default function PayrollDashboard() {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const currentWeekStart = useMemo(() => formatLocalDate(getMonday(today)), [today])
  const previousWeekStart = useMemo(() => addDays(currentWeekStart, -7), [currentWeekStart])
  const currentMonthStart = useMemo(
    () => formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    [today]
  )

  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    weekly: null,
    previousWeekly: null,
    biweekly: null,
    monthly: null,
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [weeklyRes, prevWeeklyRes, biweeklyRes, monthlyRes] = await Promise.all([
          payrollApi.getSummary({ periodType: "weekly", startDate: currentWeekStart }),
          payrollApi.getSummary({ periodType: "weekly", startDate: previousWeekStart }),
          payrollApi.getSummary({ periodType: "biweekly", startDate: currentWeekStart }),
          payrollApi.getSummary({ periodType: "monthly", startDate: currentMonthStart }),
        ])

        setDashboardData({
          weekly: weeklyRes.data,
          previousWeekly: prevWeeklyRes.data,
          biweekly: biweeklyRes.data,
          monthly: monthlyRes.data,
        })
      } catch (error) {
        console.error(error)
        setDashboardData({
          weekly: null,
          previousWeekly: null,
          biweekly: null,
          monthly: null,
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [currentMonthStart, currentWeekStart, previousWeekStart])

  const weekly = dashboardData.weekly
  const previousWeekly = dashboardData.previousWeekly
  const biweekly = dashboardData.biweekly
  const monthly = dashboardData.monthly

  const weeklySummary = weekly?.summary || {}
  const previousWeeklySummary = previousWeekly?.summary || {}
  const biweeklySummary = biweekly?.summary || {}
  const monthlySummary = monthly?.summary || {}
  const weeklyRows = weekly?.rows || []
  const departmentBreakdown = weekly?.analytics?.department_breakdown || []
  const yearlyTrend = monthly?.analytics?.yearly_trend || []
  const trendYear = monthly?.analytics?.trend_year || new Date().getFullYear()
  const auditLogs = weekly?.audit_logs || []

  const zeroHourEmployees = useMemo(
    () => weeklyRows.filter((row) => Number(row.worked_hours || 0) === 0),
    [weeklyRows]
  )

  const topEarners = useMemo(
    () =>
      [...weeklyRows]
        .sort((a, b) => Number(b.final_pay || 0) - Number(a.final_pay || 0))
        .slice(0, 5),
    [weeklyRows]
  )

  const weeklyVsPreviousChart = [
    {
      label: "Previous Week",
      final_pay: Number(previousWeeklySummary.final_pay || 0),
      worked_hours: Number(previousWeeklySummary.worked_hours || 0),
    },
    {
      label: "Current Week",
      final_pay: Number(weeklySummary.final_pay || 0),
      worked_hours: Number(weeklySummary.worked_hours || 0),
    },
    {
      label: "Biweekly View",
      final_pay: Number(biweeklySummary.final_pay || 0),
      worked_hours: Number(biweeklySummary.worked_hours || 0),
    },
  ]

  const yearlyTrendChart = yearlyTrend.map((item) => ({
    month: item.month_key,
    final_pay: Number(item.final_pay || 0),
    worked_hours: Number(item.worked_hours || 0),
  }))

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="text-3xl font-black tracking-tight text-slate-900">Payroll Dashboard</div>
            <div className="max-w-2xl text-sm text-slate-500">
              Monitor payroll health, compare periods, spot issues fast, and jump into operational payroll when you need to edit or finalize.
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <span>Current Week: {currentWeekStart}</span>
              <span>Current Month: {currentMonthStart}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/payroll")}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Open Payroll
            </button>
            <button
              onClick={() => navigate("/payroll", { state: { focus: "unpaid" } })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Review Unpaid
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current Weekly Payroll"
          value={loading ? "..." : formatCurrency(weeklySummary.final_pay)}
          subtext={`Status: ${weekly?.payroll_run?.status || "draft preview"}`}
          tone="text-cyan-700"
        />
        <StatCard
          label="Current Monthly Gross"
          value={loading ? "..." : formatCurrency(monthlySummary.gross_pay)}
          subtext={loading ? "" : formatHours(monthlySummary.worked_hours)}
        />
        <StatCard
          label="Zero-Hour Employees"
          value={loading ? "..." : zeroHourEmployees.length}
          subtext="Employees with no hours in the current weekly view"
        />
        <StatCard
          label="Biweekly Final Pay"
          value={loading ? "..." : formatCurrency(biweeklySummary.final_pay)}
          subtext="Broader two-week perspective"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <ChartCard title="Payroll Comparison" subtitle="Compare previous week, current week, and the broader biweekly view.">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVsPreviousChart} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CurrencyTooltip />} />
                <Bar dataKey="final_pay" name="Final Pay" radius={[10, 10, 0, 0]}>
                  {weeklyVsPreviousChart.map((item, index) => (
                    <Cell key={item.label} fill={["#94a3b8", "#06b6d4", "#0f172a"][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Yearly Payroll Trend" subtitle={`Saved weekly payroll trends across ${trendYear}.`}>
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading...</div>
          ) : yearlyTrendChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No saved weekly payroll history yet for this year.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyTrendChart} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CurrencyTooltip />} />
                <Line type="monotone" dataKey="final_pay" name="Final Pay" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="worked_hours" name="Worked Hours" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-base font-bold text-slate-900">Department Payroll Snapshot</div>
          <div className="mt-1 text-xs text-slate-500">Current weekly final payroll cost by department.</div>

          {loading ? (
            <div className="mt-4 text-sm text-slate-400">Loading...</div>
          ) : departmentBreakdown.length === 0 ? (
            <div className="mt-4 text-sm text-slate-400">No department payroll data for the current week.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {departmentBreakdown.map((item) => (
                <div key={item.department_name} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{item.department_name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.employees} employees | {formatHours(item.worked_hours)}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-cyan-700">{formatCurrency(item.final_pay)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-base font-bold text-slate-900">Management Attention</div>
          <div className="mt-1 text-xs text-slate-500">High-signal payroll checks and quick action points.</div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current Week Status</div>
              <div className="mt-2 text-xl font-bold text-slate-900">{weekly?.payroll_run?.status || "draft preview"}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Previous Week Final</div>
              <div className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(previousWeeklySummary.final_pay)}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">Employees With Zero Hours</div>
            {zeroHourEmployees.length === 0 ? (
              <div className="mt-2 text-sm text-slate-500">No zero-hour employees in the current weekly view.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {zeroHourEmployees.slice(0, 5).map((row) => (
                  <div key={row.employee_id} className="flex items-center justify-between gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/payroll/${row.employee_id}`)}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {row.employee_name}
                    </button>
                    <span className="text-slate-400">{row.department_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-base font-bold text-slate-900">Top Earners This Week</div>
          <div className="mt-1 text-xs text-slate-500">Employees with the highest final pay in the current weekly payroll view.</div>

          {loading ? (
            <div className="mt-4 text-sm text-slate-400">Loading...</div>
          ) : topEarners.length === 0 ? (
            <div className="mt-4 text-sm text-slate-400">No payroll rows found for the current week.</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Employee</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Department</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Hours</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Final Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {topEarners.map((row) => (
                    <tr key={row.employee_id} className="border-b last:border-b-0">
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/payroll/${row.employee_id}`)}
                          className="font-semibold text-slate-900 hover:underline"
                        >
                          {row.employee_name}
                        </button>
                        <div className="mt-1 text-xs text-slate-500">{row.mobile || row.email || "No contact"}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{row.department_name}</td>
                      <td className="px-4 py-4 text-slate-600">{formatHours(row.worked_hours)}</td>
                      <td className="px-4 py-4 font-bold text-cyan-700">{formatCurrency(row.final_pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-base font-bold text-slate-900">Recent Payroll Activity</div>
          <div className="mt-1 text-xs text-slate-500">Most recent audit activity from the current weekly payroll run.</div>

          {loading ? (
            <div className="mt-4 text-sm text-slate-400">Loading...</div>
          ) : auditLogs.length === 0 ? (
            <div className="mt-4 text-sm text-slate-400">No payroll activity recorded for the current week yet.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {log.action === "saved_draft"
                          ? "Saved draft"
                          : log.action === "finalized"
                            ? "Finalized payroll"
                            : log.action === "marked_paid"
                              ? "Marked payroll as paid"
                              : log.action}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">By {log.actor_label || "Shop User"}</div>
                    </div>
                    <div className="text-[11px] text-slate-400">{new Date(log.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

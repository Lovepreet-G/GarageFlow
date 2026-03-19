import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
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
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

function buildDraftRows(rows) {
  const drafts = {}
  for (const row of rows || []) {
    drafts[String(row.employee_id)] = {
      bonus_amount: Number(row.bonus_amount || 0),
      penalty_amount: Number(row.penalty_amount || 0),
      manual_adjustment: Number(row.manual_adjustment || 0),
      notes: row.notes || "",
    }
  }
  return drafts
}

function TrendChart({ data, sourcePeriod }) {
  const maxValue = Math.max(...data.map((item) => Number(item.final_pay || 0)), 0)

  return (
    <div className="rounded-[20px] border bg-white p-4">
      <div className="text-sm font-semibold text-slate-800">Yearly Payroll Trend</div>
      <div className="mt-1 text-xs text-slate-500">
        Based on saved {sourcePeriod} payroll runs.
      </div>
      {data.length === 0 ? (
        <div className="mt-4 text-sm text-slate-400">No saved payroll history yet for this year.</div>
      ) : (
        <div className="mt-4 flex h-56 items-end gap-3 overflow-x-auto">
          {data.map((item) => {
            const height = maxValue > 0 ? Math.max((Number(item.final_pay || 0) / maxValue) * 100, 8) : 8
            return (
              <div key={item.month_key} className="flex min-w-[72px] flex-col items-center gap-2">
                <div className="text-[11px] font-semibold text-slate-500">{formatCurrency(item.final_pay)}</div>
                <div className="flex h-40 items-end">
                  <div className="w-10 rounded-t-2xl bg-cyan-500" style={{ height: `${height}%` }} />
                </div>
                <div className="text-[11px] text-slate-400">{item.month_key}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Payroll() {
  const navigate = useNavigate()
  const [periodType, setPeriodType] = useState("weekly")
  const [periodStart, setPeriodStart] = useState(formatLocalDate(getMonday(new Date())))
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all")
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false)
  const [payrollData, setPayrollData] = useState(null)
  const [draftRows, setDraftRows] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await payrollApi.getSummary({ periodType, startDate: periodStart })
      const data = res.data
      setPayrollData(data)
      setDraftRows(buildDraftRows(data.rows))
    } catch (error) {
      console.error(error)
      setPayrollData(null)
      setDraftRows({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [periodType, periodStart])

  const allRows = payrollData?.rows || []
  const payrollRun = payrollData?.payroll_run || null
  const isWeeklyMode = periodType === "weekly"
  const isFinalized = payrollRun?.status === "finalized" || payrollRun?.status === "paid"
  const canMarkPaid = isWeeklyMode && payrollRun?.status === "finalized"
  const departmentBreakdown = payrollData?.analytics?.department_breakdown || []
  const yearlyTrend = payrollData?.analytics?.yearly_trend || []
  const trendYear = payrollData?.analytics?.trend_year || new Date().getFullYear()
  const trendSourcePeriod = payrollData?.analytics?.trend_source_period || "weekly"
  const auditLogs = payrollData?.audit_logs || []

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase()
    const queryDigits = employeeSearch.replace(/\D/g, "")

    if (!query && !queryDigits) return allRows

    return allRows.filter((row) => {
      const name = String(row.employee_name || "").toLowerCase()
      const mobileDigits = String(row.mobile || "").replace(/\D/g, "")
      return name.includes(query) || (queryDigits && mobileDigits.includes(queryDigits))
    })
  }, [allRows, employeeSearch])

  const selectedEmployeeLabel = useMemo(() => {
    if (selectedEmployeeId === "all") return "All Employees"
    const row = allRows.find((item) => String(item.employee_id) === String(selectedEmployeeId))
    if (!row) return "Select Employee"
    return `${row.employee_name}${row.mobile ? ` (${row.mobile})` : ""}`
  }, [allRows, selectedEmployeeId])

  const visibleRows = useMemo(() => {
    const source =
      selectedEmployeeId === "all"
        ? allRows
        : allRows.filter((row) => String(row.employee_id) === String(selectedEmployeeId))

    return source.map((row) => {
      const draft = draftRows[String(row.employee_id)] || {
        bonus_amount: 0,
        penalty_amount: 0,
        manual_adjustment: 0,
        notes: "",
      }

      const bonusAmount = Number(draft.bonus_amount || 0)
      const penaltyAmount = Number(draft.penalty_amount || 0)
      const manualAdjustment = Number(draft.manual_adjustment || 0)
      const finalPay = Number(
        (Number(row.gross_pay || 0) + bonusAmount - penaltyAmount + manualAdjustment).toFixed(2)
      )

      return {
        ...row,
        bonus_amount: bonusAmount,
        penalty_amount: penaltyAmount,
        manual_adjustment: manualAdjustment,
        notes: draft.notes || "",
        final_pay: finalPay,
      }
    })
  }, [allRows, draftRows, selectedEmployeeId])

  const summary = useMemo(() => {
    return visibleRows.reduce(
      (totals, row) => {
        totals.employees += 1
        totals.hours += Number(row.worked_hours || 0)
        totals.gross += Number(row.gross_pay || 0)
        totals.bonus += Number(row.bonus_amount || 0)
        totals.penalty += Number(row.penalty_amount || 0)
        totals.adjustment += Number(row.manual_adjustment || 0)
        totals.final += Number(row.final_pay || 0)
        return totals
      },
      { employees: 0, hours: 0, gross: 0, bonus: 0, penalty: 0, adjustment: 0, final: 0 }
    )
  }, [visibleRows])

  const setDraftField = (employeeId, field, value) => {
    setDraftRows((prev) => ({
      ...prev,
      [String(employeeId)]: {
        bonus_amount: 0,
        penalty_amount: 0,
        manual_adjustment: 0,
        notes: "",
        ...(prev[String(employeeId)] || {}),
        [field]: value,
      },
    }))
  }

  const buildPayloadItems = () => {
    return allRows.map((row) => {
      const draft = draftRows[String(row.employee_id)] || {}
      return {
        employee_id: row.employee_id,
        bonus_amount: Number(draft.bonus_amount || 0),
        penalty_amount: Number(draft.penalty_amount || 0),
        manual_adjustment: Number(draft.manual_adjustment || 0),
        notes: draft.notes || "",
      }
    })
  }

  const saveDraft = async () => {
    try {
      setSaving(true)
      const res = await payrollApi.saveDraft({
        periodType,
        startDate: periodStart,
        items: buildPayloadItems(),
      })
      setPayrollData(res.data)
      setDraftRows(buildDraftRows(res.data.rows))
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || "Failed to save payroll draft")
    } finally {
      setSaving(false)
    }
  }

  const finalizePayroll = async () => {
    if (!window.confirm("Finalize this payroll period? You will not be able to edit it after this.")) {
      return
    }

    try {
      setSaving(true)
      const res = await payrollApi.finalize({
        periodType,
        startDate: periodStart,
        items: buildPayloadItems(),
      })
      setPayrollData(res.data)
      setDraftRows(buildDraftRows(res.data.rows))
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || "Failed to finalize payroll")
    } finally {
      setSaving(false)
    }
  }

  const markPayrollPaid = async () => {
    if (!window.confirm("Mark this payroll period as paid?")) {
      return
    }

    try {
      setSaving(true)
      const res = await payrollApi.markPaid({
        periodType,
        startDate: periodStart,
      })
      setPayrollData(res.data)
      setDraftRows(buildDraftRows(res.data.rows))
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || "Failed to mark payroll as paid")
    } finally {
      setSaving(false)
    }
  }

  const downloadPdf = async () => {
    try {
      const res = await payrollApi.downloadPdf({
        periodType,
        startDate: periodStart,
        employeeId: selectedEmployeeId === "all" ? undefined : selectedEmployeeId,
      })
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payroll_${periodType}_${periodStart}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert(error?.response?.data?.message || "Failed to download payroll PDF")
    }
  }

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

  const selectEmployee = (employeeId) => {
    setSelectedEmployeeId(employeeId)
    setEmployeeDropdownOpen(false)
    setEmployeeSearch("")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-2xl font-extrabold">Payroll</div>
            <div className="text-xs text-slate-400">
              Gross payroll from attendance hours with manual bonus, penalty, and adjustment support.
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

          <button onClick={downloadPdf} className="rounded-xl border px-3 py-2">
            Download PDF
          </button>

          <button
            onClick={saveDraft}
            disabled={saving || isFinalized || loading || !isWeeklyMode}
            className="rounded-xl border border-cyan-600 px-4 py-2 text-sm font-semibold text-cyan-700 disabled:opacity-50"
          >
            {saving && !isFinalized ? "Saving..." : "Save Draft"}
          </button>

          <button
            onClick={finalizePayroll}
            disabled={saving || isFinalized || loading || !isWeeklyMode}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isFinalized ? "Finalized" : saving ? "Finalizing..." : "Finalize Payroll"}
          </button>

          <button
            onClick={markPayrollPaid}
            disabled={saving || !canMarkPaid || loading}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {payrollRun?.status === "paid" ? "Paid" : saving && canMarkPaid ? "Marking..." : "Mark as Paid"}
          </button>
        </div>

        <div className="max-w-md">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Employee Filter
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setEmployeeDropdownOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm"
            >
              <span className="truncate">{selectedEmployeeLabel}</span>
              <span
                className={`ml-3 text-slate-400 transition-transform ${employeeDropdownOpen ? "rotate-180" : ""}`}
              >
                ^
              </span>
            </button>

            {employeeDropdownOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border bg-white p-3 shadow-lg">
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search by name or number..."
                  className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                />

                <div className="max-h-64 space-y-1 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => selectEmployee("all")}
                    className={[
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                      selectedEmployeeId === "all" ? "bg-cyan-50 text-cyan-700" : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    All Employees
                  </button>

                  {filteredEmployees.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-400">No employees match your search.</div>
                  ) : (
                    filteredEmployees.map((row) => (
                      <button
                        key={row.employee_id}
                        type="button"
                        onClick={() => selectEmployee(String(row.employee_id))}
                        className={[
                          "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                          String(selectedEmployeeId) === String(row.employee_id)
                            ? "bg-cyan-50 text-cyan-700"
                            : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="font-medium">{row.employee_name}</div>
                        <div className="text-xs text-slate-500">{row.mobile || "No number"}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>
          {payrollData?.period ? periodLabel(payrollData.period.start_date, payrollData.period.end_date) : ""}
        </span>
        <span>•</span>
        <span>{periodType === "biweekly" ? "Biweekly" : periodType === "monthly" ? "Monthly" : "Weekly"} payroll</span>
        <span>•</span>
        <span>Status: {payrollRun?.status || "draft preview"}</span>
      </div>

      {!isWeeklyMode ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Biweekly and monthly payroll are view-only analysis modes. Weekly payroll is the only period that can be edited, finalized, and marked as paid.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[24px] border bg-white">
        <div className="flex min-w-[760px] items-stretch">
          {[
            { label: "Employees", value: summary.employees, tone: "text-slate-900" },
            { label: "Worked Hours", value: formatHours(summary.hours), tone: "text-slate-900" },
            { label: "Gross Pay", value: formatCurrency(summary.gross), tone: "text-slate-900" },
            { label: "Final Pay", value: formatCurrency(summary.final), tone: "text-cyan-700" },
          ].map((item, index) => (
            <div
              key={item.label}
              className={[
                "flex-1 px-5 py-4",
                index !== 3 ? "border-r border-slate-200" : "",
              ].join(" ")}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {item.label}
              </div>
              <div className={`mt-2 text-2xl font-extrabold ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[20px] border bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">Analytics</div>
            <div className="text-xs text-slate-500">Department payroll and yearly trend for the selected payroll type.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <TrendChart data={yearlyTrend} sourcePeriod={trendSourcePeriod} />

          <div className="rounded-[20px] border bg-white p-4">
            <div className="text-sm font-semibold text-slate-800">Department Breakdown</div>
            <div className="mt-4 space-y-3">
              {departmentBreakdown.length === 0 ? (
                <div className="text-sm text-slate-400">No department payroll data for this period.</div>
              ) : (
                departmentBreakdown.map((item) => (
                  <div key={item.department_name} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{item.department_name}</div>
                        <div className="text-xs text-slate-500">
                          {item.employees} employees • {formatHours(item.worked_hours)}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-cyan-700">{formatCurrency(item.final_pay)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">Recent Payroll Activity</div>
            <div className="text-xs text-slate-500">
              Audit trail for this payroll run.
            </div>
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {trendYear}
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-sm text-slate-400">No payroll activity recorded for this run yet.</div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="text-xs text-slate-500">
                      By {log.actor_label || "Shop User"}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[20px] border bg-white p-4">
        {loading ? (
          <div className="p-4 text-slate-400">Loading...</div>
        ) : visibleRows.length === 0 ? (
          <div className="p-4 text-slate-400">No payroll data found for this pay period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1400px] text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Worked Days</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Hours</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Rate</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Gross</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Bonus</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Penalty</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Adjustment</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Notes</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Final Pay</th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.employee_id} className="border-b align-top last:border-b-0">
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/payroll/${row.employee_id}`)}
                        className="font-semibold text-slate-900 hover:underline"
                      >
                        {row.employee_name}
                      </button>
                      <div className="text-xs text-slate-500">{row.mobile || row.email || "No contact"}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{row.worked_days}</td>
                    <td className="px-4 py-4 font-medium text-slate-800">{formatHours(row.worked_hours)}</td>
                    <td className="px-4 py-4 text-slate-600">{formatCurrency(row.hourly_rate)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-800">{formatCurrency(row.gross_pay)}</td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={row.bonus_amount}
                        disabled={isFinalized || !isWeeklyMode}
                        onChange={(e) => setDraftField(row.employee_id, "bonus_amount", e.target.value)}
                        className="w-28 rounded-lg border px-3 py-2 disabled:bg-slate-50"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={row.penalty_amount}
                        disabled={isFinalized || !isWeeklyMode}
                        onChange={(e) => setDraftField(row.employee_id, "penalty_amount", e.target.value)}
                        className="w-28 rounded-lg border px-3 py-2 disabled:bg-slate-50"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={row.manual_adjustment}
                        disabled={isFinalized || !isWeeklyMode}
                        onChange={(e) => setDraftField(row.employee_id, "manual_adjustment", e.target.value)}
                        className="w-28 rounded-lg border px-3 py-2 disabled:bg-slate-50"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <textarea
                        value={row.notes}
                        disabled={isFinalized || !isWeeklyMode}
                        onChange={(e) => setDraftField(row.employee_id, "notes", e.target.value)}
                        className="min-h-[78px] w-52 rounded-lg border px-3 py-2 disabled:bg-slate-50"
                        placeholder="Reason or note"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex rounded-xl bg-cyan-50 px-3 py-2 font-bold text-cyan-700">
                        {formatCurrency(row.final_pay)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

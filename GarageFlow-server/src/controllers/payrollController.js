import pool from "../config/db.js"
import puppeteer from "puppeteer"

function parseLocalDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function toDateOnly(value) {
  if (!value) return null
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const d = new Date(value)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function getPeriodRange(periodType, startDate) {
  if (!startDate) {
    throw new Error("startDate is required")
  }

  if (periodType === "monthly") {
    const base = parseLocalDate(startDate)
    const start = new Date(base.getFullYear(), base.getMonth(), 1)
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0)
    return { start: toDateOnly(start), end: toDateOnly(end) }
  }

  const start = parseLocalDate(startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + (periodType === "biweekly" ? 13 : 6))
  return { start: toDateOnly(start), end: toDateOnly(end) }
}

function calculateWorkedHours(punchIn, punchOut, breakStart, breakEnd) {
  if (!punchIn || !punchOut) return 0

  const toMinutes = (value) => {
    const [hour, minute] = String(value).split(":").map(Number)
    return hour * 60 + minute
  }

  let start = toMinutes(punchIn)
  let end = toMinutes(punchOut)
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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(Number(value || 0))
}

async function getExistingPayrollRun(shopId, periodType, startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT *
     FROM payroll_runs
     WHERE shop_id = ? AND period_type = ? AND start_date = ? AND end_date = ?
     LIMIT 1`,
    [shopId, periodType, startDate, endDate]
  )

  return rows[0] || null
}

async function computePayrollSummary({ shopId, periodType, startDate, employeeId = null }) {
  const { start, end } = getPeriodRange(periodType, startDate)
  const payrollRun = await getExistingPayrollRun(shopId, periodType, start, end)

  const employeeParams = [shopId]
  let employeeFilter = ""
  if (employeeId) {
    employeeFilter = " AND id = ?"
    employeeParams.push(employeeId)
  }

  const [employees] = await pool.query(
    `SELECT id, first_name, last_name, mobile, email, hourly_rate, status
     FROM employees
     WHERE shop_id = ? AND deleted_at IS NULL AND LOWER(COALESCE(status, 'active')) = 'active'${employeeFilter}
     ORDER BY first_name ASC, last_name ASC`,
    employeeParams
  )

  const attendanceParams = [shopId, start, end]
  let attendanceFilter = ""
  if (employeeId) {
    attendanceFilter = " AND employee_id = ?"
    attendanceParams.push(employeeId)
  }

  const [attendanceRows] = await pool.query(
    `SELECT employee_id, work_date, punch_in, punch_out, break_start, break_end
     FROM attendance
     WHERE shop_id = ? AND work_date BETWEEN ? AND ?${attendanceFilter}
     ORDER BY work_date ASC, employee_id ASC`,
    attendanceParams
  )

  let savedItems = []
  if (payrollRun?.id) {
    const [rows] = await pool.query(
      `SELECT *
       FROM payroll_items
       WHERE payroll_run_id = ?`,
      [payrollRun.id]
    )
    savedItems = rows
  }

  const savedMap = {}
  for (const item of savedItems) {
    savedMap[String(item.employee_id)] = item
  }

  const attendanceTotals = {}
  for (const row of attendanceRows) {
    const key = String(row.employee_id)
    if (!attendanceTotals[key]) {
      attendanceTotals[key] = { worked_days: 0, worked_hours: 0 }
    }

    attendanceTotals[key].worked_days += 1
    attendanceTotals[key].worked_hours += calculateWorkedHours(
      row.punch_in,
      row.punch_out,
      row.break_start,
      row.break_end
    )
  }

  const rows = employees.map((employee) => {
    const attendance = attendanceTotals[String(employee.id)] || { worked_days: 0, worked_hours: 0 }
    const saved = savedMap[String(employee.id)] || null
    const hourlyRate = Number(employee.hourly_rate || 0)
    const workedHours = Number(attendance.worked_hours.toFixed(2))
    const grossPay = Number((workedHours * hourlyRate).toFixed(2))
    const bonusAmount = Number(saved?.bonus_amount || 0)
    const penaltyAmount = Number(saved?.penalty_amount || 0)
    const manualAdjustment = Number(saved?.manual_adjustment || 0)
    const finalPay = Number((grossPay + bonusAmount - penaltyAmount + manualAdjustment).toFixed(2))

    return {
      employee_id: employee.id,
      employee_name: `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || `#${employee.id}`,
      mobile: employee.mobile || "",
      email: employee.email || "",
      hourly_rate: hourlyRate,
      worked_days: attendance.worked_days,
      worked_hours: workedHours,
      gross_pay: grossPay,
      bonus_amount: bonusAmount,
      penalty_amount: penaltyAmount,
      manual_adjustment: manualAdjustment,
      final_pay: finalPay,
      notes: saved?.notes || "",
    }
  })

  const summary = rows.reduce(
    (totals, row) => {
      totals.employee_count += 1
      totals.worked_hours += row.worked_hours
      totals.gross_pay += row.gross_pay
      totals.bonus_amount += row.bonus_amount
      totals.penalty_amount += row.penalty_amount
      totals.manual_adjustment += row.manual_adjustment
      totals.final_pay += row.final_pay
      return totals
    },
    {
      employee_count: 0,
      worked_hours: 0,
      gross_pay: 0,
      bonus_amount: 0,
      penalty_amount: 0,
      manual_adjustment: 0,
      final_pay: 0,
    }
  )

  for (const key of Object.keys(summary)) {
    if (key !== "employee_count") {
      summary[key] = Number(summary[key].toFixed(2))
    }
  }

  return {
    period: { period_type: periodType, start_date: start, end_date: end },
    payroll_run: payrollRun
      ? {
          id: payrollRun.id,
          status: payrollRun.status,
          created_at: payrollRun.created_at,
          updated_at: payrollRun.updated_at,
        }
      : null,
    rows,
    summary,
  }
}

async function upsertPayrollRun({ shopId, periodType, startDate, status, items }) {
  const { start, end } = getPeriodRange(periodType, startDate)
  let payrollRun = await getExistingPayrollRun(shopId, periodType, start, end)

  if (payrollRun?.status === "finalized") {
    throw new Error("This payroll period has been finalized and can no longer be edited")
  }

  if (!payrollRun) {
    const [result] = await pool.query(
      `INSERT INTO payroll_runs (shop_id, period_type, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?)`,
      [shopId, periodType, start, end, status || "draft"]
    )
    payrollRun = { id: result.insertId, status: status || "draft" }
  } else {
    await pool.query(
      `UPDATE payroll_runs
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [status || payrollRun.status || "draft", payrollRun.id]
    )
  }

  const baseSummary = await computePayrollSummary({ shopId, periodType, startDate })
  const baseRowMap = {}
  for (const row of baseSummary.rows) {
    baseRowMap[String(row.employee_id)] = row
  }

  for (const item of items || []) {
    const employeeId = Number(item.employee_id)
    const baseRow = baseRowMap[String(employeeId)]
    if (!baseRow) continue

    const bonusAmount = Number(item.bonus_amount || 0)
    const penaltyAmount = Number(item.penalty_amount || 0)
    const manualAdjustment = Number(item.manual_adjustment || 0)
    const finalPay = Number(
      (baseRow.gross_pay + bonusAmount - penaltyAmount + manualAdjustment).toFixed(2)
    )

    await pool.query(
      `INSERT INTO payroll_items (
         payroll_run_id, employee_id, worked_days, worked_hours, hourly_rate, gross_pay,
         bonus_amount, penalty_amount, manual_adjustment, final_pay, notes
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         worked_days = VALUES(worked_days),
         worked_hours = VALUES(worked_hours),
         hourly_rate = VALUES(hourly_rate),
         gross_pay = VALUES(gross_pay),
         bonus_amount = VALUES(bonus_amount),
         penalty_amount = VALUES(penalty_amount),
         manual_adjustment = VALUES(manual_adjustment),
         final_pay = VALUES(final_pay),
         notes = VALUES(notes),
         updated_at = NOW()`,
      [
        payrollRun.id,
        employeeId,
        baseRow.worked_days,
        baseRow.worked_hours,
        baseRow.hourly_rate,
        baseRow.gross_pay,
        bonusAmount,
        penaltyAmount,
        manualAdjustment,
        finalPay,
        item.notes || null,
      ]
    )
  }

  return computePayrollSummary({ shopId, periodType, startDate })
}

export const getPayrollSummary = async (req, res) => {
  const shopId = req.shop.id
  const periodType = String(req.query.periodType || "weekly").toLowerCase()
  const startDate = req.query.startDate
  const employeeId = req.query.employeeId || null

  if (!["weekly", "biweekly", "monthly"].includes(periodType)) {
    return res.status(400).json({ message: "Invalid payroll period type" })
  }

  if (!startDate) {
    return res.status(400).json({ message: "startDate is required" })
  }

  try {
    const summary = await computePayrollSummary({ shopId, periodType, startDate, employeeId })
    res.json(summary)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Failed to load payroll summary" })
  }
}

export const savePayrollDraft = async (req, res) => {
  const shopId = req.shop.id
  const { periodType, startDate, items = [] } = req.body

  if (!periodType || !startDate) {
    return res.status(400).json({ message: "periodType and startDate are required" })
  }

  try {
    const summary = await upsertPayrollRun({
      shopId,
      periodType: String(periodType).toLowerCase(),
      startDate,
      status: "draft",
      items,
    })
    res.json(summary)
  } catch (e) {
    console.error(e)
    const status = String(e.message || "").includes("finalized") ? 400 : 500
    res.status(status).json({ message: e.message || "Failed to save payroll draft" })
  }
}

export const finalizePayroll = async (req, res) => {
  const shopId = req.shop.id
  const { periodType, startDate, items = [] } = req.body

  if (!periodType || !startDate) {
    return res.status(400).json({ message: "periodType and startDate are required" })
  }

  try {
    const summary = await upsertPayrollRun({
      shopId,
      periodType: String(periodType).toLowerCase(),
      startDate,
      status: "finalized",
      items,
    })
    res.json(summary)
  } catch (e) {
    console.error(e)
    const status = String(e.message || "").includes("finalized") ? 400 : 500
    res.status(status).json({ message: e.message || "Failed to finalize payroll" })
  }
}

export const downloadPayrollPdf = async (req, res) => {
  const shopId = req.shop.id
  const periodType = String(req.query.periodType || "weekly").toLowerCase()
  const startDate = req.query.startDate
  const employeeId = req.query.employeeId || null

  if (!["weekly", "biweekly", "monthly"].includes(periodType)) {
    return res.status(400).json({ message: "Invalid payroll period type" })
  }

  if (!startDate) {
    return res.status(400).json({ message: "startDate is required" })
  }

  try {
    const data = await computePayrollSummary({ shopId, periodType, startDate, employeeId })
    const [[shopRow]] = await pool.query(
      `SELECT shop_name
       FROM shops
       WHERE id = ?
       LIMIT 1`,
      [shopId]
    )

    const rowsHtml = data.rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.employee_name)}</td>
            <td>${escapeHtml(formatCurrency(row.hourly_rate))}</td>
            <td>${escapeHtml(String(row.worked_days))}</td>
            <td>${escapeHtml(String(row.worked_hours.toFixed(2)))}</td>
            <td>${escapeHtml(formatCurrency(row.gross_pay))}</td>
            <td>${escapeHtml(formatCurrency(row.bonus_amount))}</td>
            <td>${escapeHtml(formatCurrency(row.penalty_amount))}</td>
            <td>${escapeHtml(formatCurrency(row.manual_adjustment))}</td>
            <td>${escapeHtml(formatCurrency(row.final_pay))}</td>
          </tr>
        `
      )
      .join("")

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Payroll Summary</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; margin: 24px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
            .meta { font-size: 12px; color: #6b7280; line-height: 1.6; }
            .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 12px; background: #f8fafc; }
            .card-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
            .card-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            .footer { margin-top: 16px; font-size: 11px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Payroll Summary</div>
              <div class="meta">
                <div><strong>Shop:</strong> ${escapeHtml(shopRow?.shop_name || "GarageFlow Shop")}</div>
                <div><strong>Period:</strong> ${escapeHtml(data.period.start_date)} to ${escapeHtml(data.period.end_date)}</div>
                <div><strong>Type:</strong> ${escapeHtml(periodType)}</div>
                <div><strong>Status:</strong> ${escapeHtml(data.payroll_run?.status || "draft preview")}</div>
                <div><strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString("en-CA"))}</div>
              </div>
            </div>
          </div>

          <div class="cards">
            <div class="card">
              <div class="card-label">Employees</div>
              <div class="card-value">${escapeHtml(String(data.summary.employee_count))}</div>
            </div>
            <div class="card">
              <div class="card-label">Worked Hours</div>
              <div class="card-value">${escapeHtml(String(data.summary.worked_hours.toFixed(2)))}</div>
            </div>
            <div class="card">
              <div class="card-label">Final Payroll</div>
              <div class="card-value">${escapeHtml(formatCurrency(data.summary.final_pay))}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Rate</th>
                <th>Days</th>
                <th>Hours</th>
                <th>Gross</th>
                <th>Bonus</th>
                <th>Penalty</th>
                <th>Adjustment</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="9">No payroll rows found for this period.</td></tr>`}
            </tbody>
          </table>

          <div class="footer">Generated from GarageFlow payroll reporting.</div>
        </body>
      </html>
    `

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "16px", right: "16px", bottom: "16px", left: "16px" },
    })

    await browser.close()

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payroll_${periodType}_${data.period.start_date}_to_${data.period.end_date}.pdf"`
    )
    res.send(pdf)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Failed to generate payroll PDF" })
  }
}

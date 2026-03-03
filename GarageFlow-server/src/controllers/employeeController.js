import pool from "../config/db.js"
import puppeteer from "puppeteer"

const escapeHtml = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

// GET /api/employees?q=
export const listEmployees = async (req, res) => {
  const shopId = req.shop.id
  const q = (`%${(req.query.q || "").trim()}%`).replaceAll('%', '%%') // escape percent
  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, mobile, email, hourly_rate, job_type, role_id, department_id, sin_number, status, created_at, updated_at
       FROM employees
       WHERE shop_id = ? AND (deleted_at IS NULL)
       AND (CONCAT(first_name, ' ', COALESCE(last_name, '')) LIKE ? OR email LIKE ? OR mobile LIKE ?)
       ORDER BY id DESC`,
      [shopId, q, q, q]
    )
    res.json({ employees: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// GET /api/employees/:id
export const getEmployeeById = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  try {
    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, mobile, email, hourly_rate, job_type, role_id, department_id, sin_number, status, created_at, updated_at, deleted_at
       FROM employees WHERE id = ? AND shop_id = ?`,
      [id, shopId]
    )
    if (!rows.length) return res.status(404).json({ message: "Employee not found" })
    res.json({ employee: rows[0] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// POST /api/employees
export const createEmployee = async (req, res) => {
  const shopId = req.shop.id
  const { first_name, last_name, mobile, email, hourly_rate, role_id, department_id, sin_number, job_type } = req.body
  if (!first_name) return res.status(400).json({ message: "First name required" })
  try {
    const [result] = await pool.query(
      `INSERT INTO employees (shop_id, first_name, last_name, mobile, email, hourly_rate, role_id, department_id, sin_number, job_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shopId, first_name, last_name || null, mobile || null, email || null, hourly_rate || null, role_id || null, department_id || null, sin_number || null,job_type || null] 
    )
    res.status(201).json({ id: result.insertId })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server insert error" })
  }
}

// PATCH /api/employees/:id
export const updateEmployee = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  const { first_name, last_name, mobile, email, hourly_rate, role_id, department_id, job_type, sin_number, status } = req.body
  try {
    // ensure employee belongs to shop
    const [check] = await pool.query(`SELECT id FROM employees WHERE id = ? AND shop_id = ?`, [id, shopId])
    if (!check.length) return res.status(404).json({ message: "Employee not found" })

    const [result] = await pool.query(
      `UPDATE employees SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), mobile = COALESCE(?, mobile), email = COALESCE(?, email),
         hourly_rate = COALESCE(?, hourly_rate), role_id = COALESCE(?, role_id), department_id = COALESCE(?, department_id), job_type = COALESCE(?, job_type), sin_number = COALESCE(?, sin_number),
         status = COALESCE(?, status)
       WHERE id = ? AND shop_id = ?`,
      [first_name, last_name, mobile, email, hourly_rate, role_id, department_id, job_type, sin_number, status, id, shopId]
    )

    // if status indicates termination, set deleted_at
    if (status && status.toLowerCase() !== 'active') {
      await pool.query(`UPDATE employees SET deleted_at = NOW() WHERE id = ? AND shop_id = ?`, [id, shopId])
    }

    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// DELETE /api/employees/:id  (soft delete)
export const softDeleteEmployee = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  try {
    const [check] = await pool.query(`SELECT id FROM employees WHERE id = ? AND shop_id = ?`, [id, shopId])
    if (!check.length) return res.status(404).json({ message: "Employee not found" })

    await pool.query(`UPDATE employees SET status = 'inactive', deleted_at = NOW() WHERE id = ? AND shop_id = ?`, [id, shopId])
    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// Schedules
// GET /api/employees/:id/schedules?weekStart=YYYY-MM-DD
export const listSchedules = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  const weekStart = req.query.weekStart
  try {
    if (weekStart) {
      const [r] = await pool.query(
        `SELECT * FROM employee_schedules WHERE shop_id = ? AND employee_id = ? AND week_start = ?`,
        [shopId, id, weekStart]
      )
      if (!r.length) return res.json({ schedules: [] })
      // parse JSON entries
      const sched = r[0]
      sched.entries = JSON.parse(sched.entries)
      return res.json({ schedules: [sched] })
    }

    // otherwise return recent weeks
    const [rows] = await pool.query(
      `SELECT * FROM employee_schedules WHERE shop_id = ? AND employee_id = ? ORDER BY week_start DESC LIMIT 12`,
      [shopId, id]
    )
    // parse entries
    for (const s of rows) s.entries = JSON.parse(s.entries)
    res.json({ schedules: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// POST /api/employees/:id/schedules  (body: { entries: [{date,start_time,end_time,role,notes}] })
export const createSchedules = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  const { weekStart, entries } = req.body
  if (!weekStart) return res.status(400).json({ message: 'weekStart required' })
  if (!Array.isArray(entries)) return res.status(400).json({ message: 'entries must be an array' })
  try {
    const entriesJson = JSON.stringify(entries)
    // upsert by unique key (shop_id, employee_id, week_start)
    const sql = `INSERT INTO employee_schedules (shop_id, employee_id, week_start, entries)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE entries = VALUES(entries), updated_at = NOW()`
    const [result] = await pool.query(sql, [shopId, id, weekStart, entriesJson])
    res.status(201).json({ success: true, affectedRows: result.affectedRows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// GET /api/employees/:id/schedule/pdf?weekStart=YYYY-MM-DD
export const schedulePdf = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  const weekStart = req.query.weekStart
  if (!weekStart) return res.status(400).json({ message: 'weekStart required' })
  try {
    const [r] = await pool.query(
      `SELECT s.entries, CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS name FROM employee_schedules s JOIN employees e ON e.id = s.employee_id
       WHERE s.shop_id = ? AND s.employee_id = ? AND s.week_start = ?`,
      [shopId, id, weekStart]
    )
    if (!r.length) return res.status(404).json({ message: 'Schedule not found' })

    const sched = r[0]
    const employeeName = sched.name || 'Employee'
    const entries = JSON.parse(sched.entries || '[]')

    const rowsHtml = entries
      .map((e) => {
        const day = escapeHtml(e.day || '')
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd">${day}</td>
          <td style="padding:8px;border:1px solid #ddd">${escapeHtml(e.start_time || '')}</td>
          <td style="padding:8px;border:1px solid #ddd">${escapeHtml(e.end_time || '')}</td>
          <td style="padding:8px;border:1px solid #ddd">${escapeHtml(e.role || '')}</td>
          <td style="padding:8px;border:1px solid #ddd">${escapeHtml(e.notes || '')}</td>
        </tr>`
      })
      .join('')

    const end = new Date(new Date(weekStart).getTime() + 6 * 24 * 3600 * 1000)
    const endStr = end.toISOString().slice(0, 10)

    const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Schedule - ${escapeHtml(employeeName)}</title>
        <style>
          body{font-family: Arial, Helvetica, sans-serif; color:#222}
          table{border-collapse:collapse;width:100%}
          th{background:#f3f4f6;padding:8px;border:1px solid #ddd;text-align:left}
        </style>
      </head>
      <body>
        <h2>Schedule for ${escapeHtml(employeeName)}</h2>
        <div>Week: ${escapeHtml(weekStart)} to ${escapeHtml(endStr)}</div>
        <table style="margin-top:12px">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #ddd">Date</th>
              <th style="padding:8px;border:1px solid #ddd">Start</th>
              <th style="padding:8px;border:1px solid #ddd">End</th>
              <th style="padding:8px;border:1px solid #ddd">Role</th>
              <th style="padding:8px;border:1px solid #ddd">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>`

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="schedule_${id}_${weekStart}.pdf"`)
    res.send(pdf)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

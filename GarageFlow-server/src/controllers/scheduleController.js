import pool from "../config/db.js"
import puppeteer from "puppeteer"

function toDateOnly(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function getWeekRange(weekStart) {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: toDateOnly(start),
    end: toDateOnly(end),
  }
}


function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function getWeekDays(weekStart) {
  const start = new Date(weekStart)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return {
      iso: toDateOnly(d),
      label: d.toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    }
  })
}

export const downloadWeeklySchedulePdf = async (req, res) => {
  const shopId = req.shop.id
  const weekStart = req.query.weekStart

  if (!weekStart) {
    return res.status(400).json({ message: "weekStart is required" })
  }

  try {
    const { start, end } = getWeekRange(weekStart)
    const weekDays = getWeekDays(weekStart)

    const [[shopRow]] = await pool.query(
      `SELECT id, shop_name, owner_name, email
       FROM shops
       WHERE id = ?
       LIMIT 1`,
      [shopId]
    )

    const [employees] = await pool.query(
      `SELECT id, first_name, last_name
       FROM employees
       WHERE shop_id = ? AND deleted_at IS NULL AND LOWER(COALESCE(status, 'active')) = 'active'
       ORDER BY first_name ASC, last_name ASC`,
      [shopId]
    )

    const [schedules] = await pool.query(
      `SELECT employee_id, work_date, start_time, end_time, break_start, break_end, notes
       FROM employee_schedules
       WHERE shop_id = ? AND work_date BETWEEN ? AND ?
       ORDER BY work_date ASC, employee_id ASC`,
      [shopId, start, end]
    )

    const scheduleMap = {}
    for (const s of schedules) {
      scheduleMap[`${s.employee_id}_${s.work_date}`] = s
    }

    const rowsHtml = employees
      .map((emp) => {
        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim()

        const cells = weekDays
          .map((day) => {
            const s = scheduleMap[`${emp.id}_${day.iso}`]
            if (!s) return `<td class="empty">—</td>`

            const breakText =
              s.break_start && s.break_end
                ? `<div class="break">Break: ${escapeHtml(s.break_start)} - ${escapeHtml(s.break_end)}</div>`
                : ""

            const notesText = s.notes
              ? `<div class="notes">${escapeHtml(s.notes)}</div>`
              : ""

            return `
              <td>
                <div class="shift">${escapeHtml(s.start_time)} - ${escapeHtml(s.end_time)}</div>
                ${breakText}
                ${notesText}
              </td>
            `
          })
          .join("")

        return `
          <tr>
            <td class="employee-name">${escapeHtml(fullName || "—")}</td>
            ${cells}
          </tr>
        `
      })
      .join("")

    const generatedAt = new Date().toLocaleString("en-CA")

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Weekly Schedule</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1f2937;
            margin: 24px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .meta {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px;
            vertical-align: top;
            font-size: 12px;
          }
          th {
            background: #f3f4f6;
            font-weight: 700;
            text-align: left;
          }
          .employee-col {
            width: 16%;
          }
          .employee-name {
            font-weight: 700;
            background: #fafafa;
          }
          .shift {
            font-weight: 700;
            color: #111827;
            margin-bottom: 4px;
          }
          .break {
            font-size: 11px;
            color: #2563eb;
            margin-bottom: 3px;
          }
          .notes {
            font-size: 11px;
            color: #6b7280;
          }
          .empty {
            color: #9ca3af;
            text-align: center;
          }
          .footer {
            margin-top: 16px;
            font-size: 11px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Weekly Schedule</div>
            <div class="meta">
              <div><strong>Shop:</strong> ${escapeHtml(shopRow?.shop_name || "GarageFlow Shop")}</div>
              <div><strong>Week:</strong> ${escapeHtml(start)} to ${escapeHtml(end)}</div>
              <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="employee-col">Employee</th>
              ${weekDays.map((d) => `<th>${escapeHtml(d.label)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="8" class="empty">No schedule found for this week.</td></tr>`}
          </tbody>
        </table>

        <div class="footer">
          Generated from GarageFlow weekly scheduling.
        </div>
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
      margin: {
        top: "16px",
        right: "16px",
        bottom: "16px",
        left: "16px",
      },
    })

    await browser.close()

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="weekly_schedule_${start}_to_${end}.pdf"`
    )
    res.send(pdf)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Failed to generate schedule PDF" })
  }
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return !(aEnd <= bStart || bEnd <= aStart)
}




function isPastWorkDate(workDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const d = new Date(workDate)
  d.setHours(0, 0, 0, 0)

  return d < today
}

export const listSchedules = async (req, res) => {
  const shopId = req.shop.id
  const weekStart = req.query.weekStart

  try {
    if (weekStart) {
      const { start, end } = getWeekRange(weekStart)

      const [rows] = await pool.query(
        `SELECT *
         FROM employee_schedules
         WHERE shop_id = ? AND work_date BETWEEN ? AND ?
         ORDER BY work_date ASC, employee_id ASC`,
        [shopId, start, end]
      )

      return res.json({ schedules: rows })
    }

    const [rows] = await pool.query(
      `SELECT *
       FROM employee_schedules
       WHERE shop_id = ?
       ORDER BY work_date DESC
       LIMIT 100`,
      [shopId]
    )

    res.json({ schedules: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

export const createSchedule = async (req, res) => {
  const shopId = req.shop.id
  const {
    employee_id,
    work_date,
    start_time,
    end_time,
    break_start,
    break_end,
    notes,
    created_by_user_id,
  } = req.body

  if (!employee_id || !work_date || !start_time || !end_time) {
    return res.status(400).json({ message: "Employee, date, start time and end time are required" })
  }

  if (isPastWorkDate(work_date)) {
    return res.status(400).json({ message: "Past schedule dates cannot be created" })
  }

  if (end_time <= start_time) {
    return res.status(400).json({ message: "End time must be after start time" })
  }

  if ((break_start && !break_end) || (!break_start && break_end)) {
    return res.status(400).json({ message: "Both break start and break end are required together" })
  }

  if (break_start && break_end) {
    if (!(break_start >= start_time && break_end <= end_time && break_end > break_start)) {
      return res.status(400).json({ message: "Break must be inside the shift" })
    }
  }

  try {
    const [chk] = await pool.query(
      `SELECT id, status
       FROM employees
       WHERE id = ? AND shop_id = ? AND deleted_at IS NULL`,
      [employee_id, shopId]
    )

    if (!chk.length) return res.status(400).json({ message: "Employee not found" })
    if (String(chk[0].status || "").toLowerCase() !== "active") {
      return res.status(400).json({ message: "Only active employees can be scheduled" })
    }

    const [existing] = await pool.query(
      `SELECT *
       FROM employee_schedules
       WHERE shop_id = ? AND employee_id = ? AND work_date = ?`,
      [shopId, employee_id, work_date]
    )

    for (const s of existing) {
      if (overlaps(start_time, end_time, s.start_time, s.end_time)) {
        return res.status(400).json({ message: "Overlapping shift for this employee on the same day" })
      }
    }

    const [result] = await pool.query(
      `INSERT INTO employee_schedules
       (shop_id, employee_id, work_date, start_time, end_time, break_start, break_end, notes, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        employee_id,
        work_date,
        start_time,
        end_time,
        break_start || null,
        break_end || null,
        notes || null,
        created_by_user_id || null,
      ]
    )

    await pool.query(
      `INSERT INTO attendance
       (shop_id, employee_id, work_date, scheduled_start, scheduled_end, punch_in, punch_out, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'schedule')
       ON DUPLICATE KEY UPDATE
         scheduled_start = VALUES(scheduled_start),
         scheduled_end = VALUES(scheduled_end),
         punch_in = CASE WHEN source = 'schedule' THEN VALUES(punch_in) ELSE punch_in END,
         punch_out = CASE WHEN source = 'schedule' THEN VALUES(punch_out) ELSE punch_out END,
         updated_at = NOW()`,
      [shopId, employee_id, work_date, start_time, end_time, start_time, end_time]
    )

    res.status(201).json({ id: result.insertId })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

export const updateSchedule = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  const { start_time, end_time, break_start, break_end, notes, status } = req.body

  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM employee_schedules
       WHERE id = ? AND shop_id = ?`,
      [id, shopId]
    )

    if (!rows.length) return res.status(404).json({ message: "Schedule not found" })
    const current = rows[0]

    if (isPastWorkDate(current.work_date)) {
      return res.status(400).json({ message: "Past schedule dates cannot be updated" })
    }

    const nextStart = start_time || current.start_time
    const nextEnd = end_time || current.end_time
    const nextBreakStart = break_start ?? current.break_start
    const nextBreakEnd = break_end ?? current.break_end

    if (nextEnd <= nextStart) {
      return res.status(400).json({ message: "End time must be after start time" })
    }

    if ((nextBreakStart && !nextBreakEnd) || (!nextBreakStart && nextBreakEnd)) {
      return res.status(400).json({ message: "Both break start and break end are required together" })
    }

    if (nextBreakStart && nextBreakEnd) {
      if (!(nextBreakStart >= nextStart && nextBreakEnd <= nextEnd && nextBreakEnd > nextBreakStart)) {
        return res.status(400).json({ message: "Break must be inside the shift" })
      }
    }

    const [others] = await pool.query(
      `SELECT *
       FROM employee_schedules
       WHERE shop_id = ? AND employee_id = ? AND work_date = ? AND id <> ?`,
      [shopId, current.employee_id, current.work_date, id]
    )

    for (const s of others) {
      if (overlaps(nextStart, nextEnd, s.start_time, s.end_time)) {
        return res.status(400).json({ message: "Overlapping shift for this employee on the same day" })
      }
    }

    await pool.query(
      `UPDATE employee_schedules
       SET start_time = ?,
           end_time = ?,
           break_start = ?,
           break_end = ?,
           notes = ?,
           status = COALESCE(?, status)
       WHERE id = ? AND shop_id = ?`,
      [
        nextStart,
        nextEnd,
        nextBreakStart || null,
        nextBreakEnd || null,
        notes ?? current.notes,
        status,
        id,
        shopId,
      ]
    )

    await pool.query(
      `UPDATE attendance
       SET scheduled_start = ?,
           scheduled_end = ?,
           punch_in = CASE WHEN source = 'schedule' THEN ? ELSE punch_in END,
           punch_out = CASE WHEN source = 'schedule' THEN ? ELSE punch_out END,
           updated_at = NOW()
       WHERE shop_id = ? AND employee_id = ? AND work_date = ?`,
      [
        nextStart,
        nextEnd,
        nextStart,
        nextEnd,
        shopId,
        current.employee_id,
        current.work_date,
      ]
    )

    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

export const deleteSchedule = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM employee_schedules
       WHERE id = ? AND shop_id = ?`,
      [id, shopId]
    )

    if (!rows.length) return res.status(404).json({ message: "Schedule not found" })
    const s = rows[0]

    if (isPastWorkDate(s.work_date)) {
      return res.status(400).json({ message: "Past schedule dates cannot be deleted" })
    }

    await pool.query(`DELETE FROM employee_schedules WHERE id = ? AND shop_id = ?`, [id, shopId])

    await pool.query(
      `DELETE FROM attendance
       WHERE shop_id = ? AND employee_id = ? AND work_date = ? AND source = 'schedule'`,
      [shopId, s.employee_id, s.work_date]
    )

    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}
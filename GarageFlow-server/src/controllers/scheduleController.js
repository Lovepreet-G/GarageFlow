import pool from "../config/db.js"

function overlaps(aStart, aEnd, bStart, bEnd) {
  return !(aEnd <= bStart || bEnd <= aStart)
}

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
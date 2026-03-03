import pool from "../config/db.js"

// Validate overlap: ensure same employee has no overlapping shift on same day
function overlaps(aStart, aEnd, bStart, bEnd) {
  return !(aEnd <= bStart || bEnd <= aStart)
}

export const listSchedules = async (req, res) => {
  const shopId = req.shop.id
  const weekStart = req.query.weekStart
  try {
    if (weekStart) {
      const start = new Date(weekStart)
      const end = new Date(start.getTime() + 6 * 24 * 3600 * 1000)
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)
      const [rows] = await pool.query(`SELECT * FROM employee_schedules WHERE shop_id = ? AND work_date BETWEEN ? AND ?`, [shopId, startStr, endStr])
      res.json({ schedules: rows })
      return
    }
    const [rows] = await pool.query(`SELECT * FROM employee_schedules WHERE shop_id = ? ORDER BY work_date DESC LIMIT 100`, [shopId])
    res.json({ schedules: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createSchedule = async (req, res) => {
  const shopId = req.shop.id
  const { employee_id, work_date, start_time, end_time, break_start, break_end, notes, created_by_user_id } = req.body
  if (!employee_id || !work_date || !start_time || !end_time) return res.status(400).json({ message: 'required fields' })
  try {
    // validate employee belongs to shop
    const [chk] = await pool.query(`SELECT id FROM employees WHERE id = ? AND shop_id = ? AND deleted_at IS NULL`, [employee_id, shopId])
    if (!chk.length) return res.status(400).json({ message: 'Employee not found' })

    // check overlapping shifts for same employee on same day
    const [existing] = await pool.query(`SELECT * FROM employee_schedules WHERE employee_id = ? AND work_date = ?`, [employee_id, work_date])
    for (const s of existing) {
      if (overlaps(start_time, end_time, s.start_time, s.end_time)) {
        return res.status(400).json({ message: 'Overlapping shift' })
      }
    }

    const [result] = await pool.query(`INSERT INTO employee_schedules (shop_id, employee_id, work_date, start_time, end_time, break_start, break_end, notes, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [shopId, employee_id, work_date, start_time, end_time, break_start || null, break_end || null, notes || null, created_by_user_id || null])

    // create attendance record from schedule
    await pool.query(`INSERT INTO attendance (shop_id, employee_id, work_date, scheduled_start, scheduled_end, punch_in, punch_out, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'schedule') ON DUPLICATE KEY UPDATE scheduled_start=VALUES(scheduled_start), scheduled_end=VALUES(scheduled_end), punch_in=VALUES(punch_in), punch_out=VALUES(punch_out), updated_at=NOW()`, [shopId, employee_id, work_date, start_time, end_time, start_time, end_time])

    res.status(201).json({ id: result.insertId })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateSchedule = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  const { start_time, end_time, break_start, break_end, notes, status } = req.body
  try {
    const [rows] = await pool.query(`SELECT * FROM employee_schedules WHERE id = ? AND shop_id = ?`, [id, shopId])
    if (!rows.length) return res.status(404).json({ message: 'Not found' })
    const s = rows[0]

    // check overlapping with other shifts for same employee on same day
    const [others] = await pool.query(`SELECT * FROM employee_schedules WHERE employee_id = ? AND work_date = ? AND id <> ?`, [s.employee_id, s.work_date, id])
    for (const o of others) {
      if (overlaps(start_time || s.start_time, end_time || s.end_time, o.start_time, o.end_time)) return res.status(400).json({ message: 'Overlapping shift' })
    }

    await pool.query(`UPDATE employee_schedules SET start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), break_start = COALESCE(?, break_start), break_end = COALESCE(?, break_end), notes = COALESCE(?, notes), status = COALESCE(?, status) WHERE id = ? AND shop_id = ?`, [start_time, end_time, break_start, break_end, notes, status, id, shopId])

    // update attendance to match schedule
    await pool.query(`UPDATE attendance SET scheduled_start = ?, scheduled_end = ?, punch_in = ?, punch_out = ?, updated_at = NOW() WHERE employee_id = ? AND work_date = ?`, [start_time, end_time, start_time, end_time, s.employee_id, s.work_date])

    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteSchedule = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  try {
    const [rows] = await pool.query(`SELECT * FROM employee_schedules WHERE id = ? AND shop_id = ?`, [id, shopId])
    if (!rows.length) return res.status(404).json({ message: 'Not found' })
    const s = rows[0]
    await pool.query(`DELETE FROM employee_schedules WHERE id = ? AND shop_id = ?`, [id, shopId])
    // remove attendance created from this schedule (if exists and source=schedule)
    await pool.query(`DELETE FROM attendance WHERE employee_id = ? AND work_date = ? AND source = 'schedule'`, [s.employee_id, s.work_date])
    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

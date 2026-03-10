import pool from "../config/db.js"

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

export const listAttendance = async (req, res) => {
  const shopId = req.shop.id
  const date = req.query.date
  const weekStart = req.query.weekStart

  try {
    if (date) {
      const [rows] = await pool.query(
        `SELECT *
         FROM attendance
         WHERE shop_id = ? AND work_date = ?
         ORDER BY employee_id ASC`,
        [shopId, date]
      )
      return res.json({ attendance: rows })
    }

    if (weekStart) {
      const { start, end } = getWeekRange(weekStart)
      const [rows] = await pool.query(
        `SELECT *
         FROM attendance
         WHERE shop_id = ? AND work_date BETWEEN ? AND ?
         ORDER BY work_date ASC, employee_id ASC`,
        [shopId, start, end]
      )
      return res.json({ attendance: rows })
    }

    const [rows] = await pool.query(
      `SELECT *
       FROM attendance
       WHERE shop_id = ?
       ORDER BY work_date DESC
       LIMIT 100`,
      [shopId]
    )

    res.json({ attendance: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

export const updateAttendance = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  const { punch_in, punch_out } = req.body

  if (!punch_in || !punch_out) {
    return res.status(400).json({ message: "Punch in and punch out are required" })
  }

  if (punch_out <= punch_in) {
    return res.status(400).json({ message: "Punch out must be after punch in" })
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, work_date
       FROM attendance
       WHERE id = ? AND shop_id = ?`,
      [id, shopId]
    )

    if (!rows.length) return res.status(404).json({ message: "Attendance row not found" })

    const userRole = String(req.user?.role || req.shop?.role || "").toLowerCase()
    const isShopLogin = Boolean(req.shop?.id)
    const canEditPastAttendance =
      isShopLogin || userRole === "admin" || userRole === "manager"

    const workDate = new Date(rows[0].work_date)
    workDate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (workDate < today && !canEditPastAttendance) {
      return res.status(403).json({ message: "You are not allowed to edit past attendance" })
    }

    await pool.query(
      `UPDATE attendance
       SET punch_in = ?,
           punch_out = ?,
           source = 'manual',
           updated_at = NOW()
       WHERE id = ? AND shop_id = ?`,
      [punch_in, punch_out, id, shopId]
    )

    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}
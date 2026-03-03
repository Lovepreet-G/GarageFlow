import pool from "../config/db.js"

export const listAttendance = async (req, res) => {
  const shopId = req.shop.id
  const date = req.query.date
  const weekStart = req.query.weekStart
  try {
    if (date) {
      const [rows] = await pool.query(`SELECT * FROM attendance WHERE shop_id = ? AND work_date = ?`, [shopId, date])
      return res.json({ attendance: rows })
    }
    if (weekStart) {
      const start = new Date(weekStart)
      const end = new Date(start.getTime() + 6 * 24 * 3600 * 1000)
      const [rows] = await pool.query(`SELECT * FROM attendance WHERE shop_id = ? AND work_date BETWEEN ? AND ?`, [shopId, weekStart, end.toISOString().slice(0,10)])
      return res.json({ attendance: rows })
    }
    const [rows] = await pool.query(`SELECT * FROM attendance WHERE shop_id = ? ORDER BY work_date DESC LIMIT 100`, [shopId])
    res.json({ attendance: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

import pool from "../config/db.js"

export const getDashboard = async (req, res) => {
  const shopId = req.shop.id

  const now = new Date()
  const month = Number(req.query.month) || now.getMonth() + 1 // 1-12
  const year = Number(req.query.year) || now.getFullYear()

  // safer than toISOString() (avoids UTC shift)
  const todayLocal = now.toLocaleDateString("en-CA") // YYYY-MM-DD
  const weekStart = req.query.weekStart || todayLocal

  try {
    // Total sales (Paid) for selected month/year
    const [salesRows] = await pool.query(
      `
      SELECT COALESCE(SUM(total_amount),0) AS totalSales
      FROM invoices
      WHERE shop_id = ?
        AND status = 'Paid'
        AND YEAR(invoice_date) = ?
        AND MONTH(invoice_date) = ?
      `,
      [shopId, year, month]
    )

    // Total unpaid (Approved + Overdue)
    const [unpaidRows] = await pool.query(
      `
      SELECT COALESCE(SUM(total_amount),0) AS totalUnpaid
      FROM invoices
      WHERE shop_id = ?
        AND status IN ('Approved','Overdue')
      `,
      [shopId]
    )

    // ✅ Daily sales for selected week — ALWAYS returns 7 days (Mon..Sun)
    const [dailyRows] = await pool.query(
      `
      WITH RECURSIVE days AS (
        SELECT DATE(?) AS day
        UNION ALL
        SELECT DATE_ADD(day, INTERVAL 1 DAY)
        FROM days
        WHERE day < DATE_ADD(DATE(?), INTERVAL 6 DAY)
      )
      SELECT
        DATE_FORMAT(d.day, '%Y-%m-%d') AS day,
        COALESCE(SUM(i.total_amount), 0) AS total
      FROM days d
      LEFT JOIN invoices i
        ON i.shop_id = ?
       AND i.status = 'Paid'
       AND i.invoice_date = d.day
      GROUP BY d.day
      ORDER BY d.day ASC
      `,
      [weekStart, weekStart, shopId]
    )

    // Reminder list: Approved not paid for >= 7 days
    const [reminderRows] = await pool.query(
      `
      SELECT
        i.id,
        i.invoice_number,
        DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS invoice_date,
        i.total_amount,
        DATEDIFF(CURDATE(), i.invoice_date) AS days_open,
        c.customer_name,
        v.vehicle_vin
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      JOIN vehicles v ON v.id = i.vehicle_id
      WHERE i.shop_id = ?
        AND i.status = 'Approved'
        AND i.invoice_date <= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY i.invoice_date ASC
      LIMIT 20
      `,
      [shopId]
    )

    res.json({
      month,
      year,
      weekStart,
      totalSales: Number(salesRows[0]?.totalSales || 0),
      totalUnpaid: Number(unpaidRows[0]?.totalUnpaid || 0),
      dailySales: dailyRows.map((r) => ({
        day: r.day, // already 'YYYY-MM-DD'
        total: Number(r.total),
      })),
      reminders: reminderRows.map((r) => ({
        id: r.id,
        invoice_number: r.invoice_number,
        invoice_date: String(r.invoice_date),
        total_amount: Number(r.total_amount),
        days_open: Number(r.days_open),
        customer_name: r.customer_name,
        vehicle_vin: r.vehicle_vin,
      })),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

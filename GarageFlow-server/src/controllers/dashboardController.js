import pool from "../config/db.js"

export const getDashboard = async (req, res) => {
  const shopId = req.shop.id

  const month = Number(req.query.month) || new Date().getMonth() + 1 // 1-12
  const year = Number(req.query.year) || new Date().getFullYear()

  // weekStart in YYYY-MM-DD (we’ll use Monday start on frontend)
  const weekStart = req.query.weekStart || new Date().toISOString().slice(0, 10)

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

    // Daily sales for the selected week (Paid only)
    const [dailyRows] = await pool.query(
      `
      SELECT invoice_date AS day, COALESCE(SUM(total_amount),0) AS total
      FROM invoices
      WHERE shop_id = ?
        AND status = 'Paid'
        AND invoice_date BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)
      GROUP BY invoice_date
      ORDER BY invoice_date ASC
      `,
      [shopId, weekStart, weekStart]
    )

    // Reminder list: Approved not paid for >= 7 days (based on invoice_date)
    const [reminderRows] = await pool.query(
      `
      SELECT
        i.id,
        i.invoice_number,
        i.invoice_date,
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
        day: String(r.day),
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

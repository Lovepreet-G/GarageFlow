import pool from "../config/db.js"

export const listCustomers = async (req, res) => {
  const shopId = req.shop.id
  const q = (req.query.q || "").trim()

  try {
    let sql = `SELECT id, customer_name, customer_phone, customer_email
               FROM customers
               WHERE shop_id = ?`
    const params = [shopId]

    if (q) {
      sql += ` AND (customer_name LIKE ? OR customer_phone LIKE ?)`
      params.push(`%${q}%`, `%${q}%`)
    }

    sql += ` ORDER BY customer_name ASC LIMIT 50`
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

export const createCustomer = async (req, res) => {
  const shopId = req.shop.id
  const { customer_name, customer_phone, customer_email, customer_address } = req.body

  if (!customer_name || !customer_phone) {
    return res.status(400).json({ message: "Customer name and phone required" })
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO customers (shop_id, customer_name, customer_phone, customer_email, customer_address)
       VALUES (?, ?, ?, ?, ?)`,
      [shopId, customer_name, customer_phone, customer_email || null, customer_address || null]
    )

    res.status(201).json({ id: result.insertId })
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Customer with this phone already exists" })
    }
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// get single customer (for right-side detail panel)
export const getCustomerById = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM customers
       WHERE id = ? AND shop_id = ?
       LIMIT 1`,
      [id, shopId]
    )

    if (!rows.length) {
      return res.status(404).json({ message: "Customer not found" })
    }

    res.json(rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

export const listCustomerVehicles = async (req, res) => {
  const shopId = req.shop.id
  const customerId = req.params.id

  try {
    const [rows] = await pool.query(
      `SELECT id, vehicle_vin, make, model, year, license_plate
       FROM vehicles
       WHERE shop_id = ? AND customer_id = ?
       ORDER BY id DESC`,
      [shopId, customerId]
    )
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// repair history (invoices list for that customer)
export const getCustomerHistory = async (req, res) => {
  const shopId = req.shop.id
  const customerId = req.params.id

  try {
    // extra safety: customer must belong to this shop
    const [c] = await pool.query(
      `SELECT id FROM customers WHERE id = ? AND shop_id = ? LIMIT 1`,
      [customerId, shopId]
    )
    if (!c.length) return res.status(404).json({ message: "Customer not found" })

    const [rows] = await pool.query(
      `
      SELECT
        i.id,
        i.invoice_number,
        DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS invoice_date,
        i.total_amount,
        v.vehicle_vin,
        v.make,
        v.model,
        v.year
      FROM invoices i
      JOIN vehicles v ON v.id = i.vehicle_id
      WHERE i.shop_id = ? AND i.customer_id = ?
      ORDER BY i.invoice_date DESC, i.id DESC
      `,
      [shopId, customerId]
    )

    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

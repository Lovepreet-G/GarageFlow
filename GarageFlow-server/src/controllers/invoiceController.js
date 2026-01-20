import pool from "../config/db.js"

// GET /api/invoices?status=&q=&from=&to=
export const listInvoices = async (req, res) => {
  const shopId = req.shop.id
  const { status, q, from, to } = req.query

  try {
    let sql = `
      SELECT
        i.id,
        i.invoice_number,
        i.invoice_date,
        i.subtotal_amount,
        i.tax_amount,
        i.total_amount,
        i.status,
        c.customer_name,
        v.vehicle_vin
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      JOIN vehicles v ON v.id = i.vehicle_id
      WHERE i.shop_id = ?
    `
    const params = [shopId]

    // status filter: Draft / Paid / Overdue / Approved
    if (status) {
      sql += " AND i.status = ?"
      params.push(status)
    }

    // date range filter
    if (from) {
      sql += " AND i.invoice_date >= ?"
      params.push(from)
    }
    if (to) {
      sql += " AND i.invoice_date <= ?"
      params.push(to)
    }

    // Search: customer name OR VIN OR invoice number
    if (q) {
      sql += " AND (c.customer_name LIKE ? OR v.vehicle_vin LIKE ? OR i.invoice_number LIKE ?)"
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }

    sql += " ORDER BY i.invoice_date DESC, i.id DESC"

    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}

// GET /api/invoices/:id (with items)
export const getInvoiceById = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params

  try {
    const [invRows] = await pool.query(
      `
      SELECT
        i.*,
        c.customer_name, c.customer_address, c.customer_phone, c.customer_email,
        v.vehicle_vin, v.make, v.model, v.year, v.license_plate,
        s.shop_name, s.shop_address, s.shop_phone, s.shop_email, s.tax_id, s.logo_url
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      JOIN vehicles v ON v.id = i.vehicle_id
      JOIN shops s ON s.id = i.shop_id
      WHERE i.id = ? AND i.shop_id = ?
      `,
      [id, shopId]
    )

    if (!invRows.length) {
      return res.status(404).json({ message: "Invoice not found" })
    }

    const invoice = invRows[0]

    const [items] = await pool.query(
      "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC",
      [id]
    )

    res.json({ invoice, items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}

// PATCH /api/invoices/:id/status
export const updateInvoiceStatus = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  const { status } = req.body

  const allowed = ["Draft", "Approved", "Paid", "Overdue"]
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" })
  }

  try {
    const [result] = await pool.query(
      "UPDATE invoices SET status = ? WHERE id = ? AND shop_id = ?",
      [status, id, shopId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Invoice not found" })
    }

    res.json({ message: "Status updated" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}

/**
 * POST /api/invoices
 * MVP payload:
 * {
 *   invoice_number, customer_id, vehicle_id,
 *   invoice_date, due_date, odometer_reading,
 *   subtotal_amount, tax_amount, total_amount,
 *   status,
 *   items: [{ item_description, type, condition, quantity, unit_price, total_price }]
 * }
 */
export const createInvoice = async (req, res) => {
  const shopId = req.shop.id
  const {
    customer_id,
    vehicle_id,
    invoice_date,
    due_date,
    odometer_reading,
    subtotal_amount,
    tax_amount,
    total_amount,
    status = "Draft",
    warranty_statement,
    items = [],
  } = req.body

  if (!customer_id || !vehicle_id || !invoice_date) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Invoice items required" })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    // Generate invoice number (simple sequential per shop)
    const [shopRows] = await conn.query(
    "SELECT next_invoice_no FROM shops WHERE id = ? FOR UPDATE",
    [shopId]
    )

    if (!shopRows.length) {
    await conn.rollback()
    return res.status(400).json({ message: "Shop not found" })
    }

    const nextNo = shopRows[0].next_invoice_no
    const invoice_number = `INV-${String(nextNo).padStart(5, "0")}`

    // increment counter
    await conn.query(
    "UPDATE shops SET next_invoice_no = next_invoice_no + 1 WHERE id = ?",
    [shopId]
    )
    // --- end invoice number generation ---

    // Ensure customer belongs to logged-in shop
    const [custRows] = await conn.query(
        "SELECT id FROM customers WHERE id = ? AND shop_id = ?",
        [customer_id, shopId]
    )

    if (!custRows.length) {
        await conn.rollback()
        return res.status(400).json({ message: "Customer not found" })
    }

    // Ensure vehicle belongs to same shop AND customer
    const [vehRows] = await conn.query(
        "SELECT id FROM vehicles WHERE id = ? AND customer_id = ? AND shop_id = ?",
        [vehicle_id, customer_id, shopId]
    )

    if (!vehRows.length) {
        await conn.rollback()
        return res.status(400).json({ message: "Vehicle not found for this customer" })
    }


    

    // Insert invoice
    const [invResult] = await conn.query(
      `
      INSERT INTO invoices
        (invoice_number, shop_id, customer_id, vehicle_id, invoice_date, due_date, odometer_reading,
         subtotal_amount, tax_amount, total_amount, status, warranty_statement)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        invoice_number,
        shopId,
        customer_id,
        vehicle_id,
        invoice_date,
        due_date || null,
        odometer_reading || null,
        subtotal_amount,
        tax_amount,
        total_amount,
        status,
        warranty_statement || "90 days or 5,000 km",
      ]
    )

    const invoiceId = invResult.insertId

    // Insert items
    for (const it of items) {
      const {
        item_description,
        type,
        condition,
        quantity,
        unit_price,
        total_price,
      } = it

      if (!item_description || !type || !quantity || !unit_price || !total_price) {
        await conn.rollback()
        return res.status(400).json({ message: "Invalid invoice item data" })
      }

      await conn.query(
        `
        INSERT INTO invoice_items
          (invoice_id, item_description, type, \`condition\`, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          invoiceId,
          item_description,
          type,
          condition || null,
          quantity,
          unit_price,
          total_price,
        ]
      )
    }

    await conn.commit()
    res.status(201).json({ message: "Invoice created", invoice_id: invoiceId })
  } catch (err) {
    await conn.rollback()
    console.error(err)
    res.status(500).json({ message: "Server error" })
  } finally {
    conn.release()
  }
}

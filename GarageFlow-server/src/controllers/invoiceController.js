import puppeteer from "puppeteer"
import pool from "../config/db.js"
// helper
const money = (v) => Number(v || 0).toFixed(2)

const escapeHtml = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

const invoiceHtml = ({ invoice, items }) => {
  // NOTE: status and warranty intentionally NOT shown (your requirement)
  const shopName = escapeHtml(invoice.shop_name)
  const shopAddress = escapeHtml(invoice.shop_address || "")
  const shopPhone = escapeHtml(invoice.shop_phone || "")
  const shopEmail = escapeHtml(invoice.shop_email || "")
  const taxId = escapeHtml(invoice.tax_id || "")

  const customerName = escapeHtml(invoice.customer_name || "")
  const customerPhone = escapeHtml(invoice.customer_phone || "")
  const customerEmail = escapeHtml(invoice.customer_email || "")
  const customerAddress = escapeHtml(invoice.customer_address || "")

  const vin = escapeHtml(invoice.vehicle_vin || "")
  const makeModel = escapeHtml([invoice.make, invoice.model].filter(Boolean).join(" "))
  const year = escapeHtml(invoice.year || "")
  const plate = escapeHtml(invoice.license_plate || "")
  const odo = invoice.odometer_reading ?? ""

  const note = invoice.note ? escapeHtml(invoice.note) : ""

  const itemRows = items
    .map(
      (it) => `
      <tr>
        <td>${escapeHtml(it.item_description)}</td>
        <td>${escapeHtml(it.type)}</td>
        <td>${escapeHtml(it.condition || "-")}</td>
        <td style="text-align:right;">${it.quantity}</td>
        <td style="text-align:right;">$${money(it.unit_price)}</td>
        <td style="text-align:right;"><b>$${money(it.total_price)}</b></td>
      </tr>
    `
    )
    .join("")

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(invoice.invoice_number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; color: #111; }
    .top { display:flex; justify-content: space-between; gap: 24px; }
    .shop { display:flex; gap: 16px; align-items:flex-start; }
    .logoBox { width: 80px; height: 80px; border: 1px solid #ddd; display:flex; align-items:center; justify-content:center; font-size:12px; color:#777; }
    .shop h1 { margin: 0; font-size: 22px; }
    .muted { color:#555; font-size: 12px; line-height: 1.4; white-space: pre-line; }
    .meta { text-align: right; }
    .meta .title { font-size: 28px; font-weight: 800; margin:0; }
    .meta .row { font-size: 12px; margin-top: 6px; }
    hr { border:0; border-top: 1px solid #ddd; margin: 18px 0; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
    .card h3 { margin:0 0 8px; font-size: 13px; }
    .card .line { font-size: 12px; line-height: 1.5; }
    table { width:100%; border-collapse: collapse; }
    thead th { background:#f3f4f6; font-size: 12px; text-align:left; padding: 10px; border-bottom: 1px solid #ddd; }
    tbody td { font-size: 12px; padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    .totalsWrap { display:flex; justify-content:flex-end; margin-top: 12px; }
    .totals { width: 320px; border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
    .totals .row { display:flex; justify-content:space-between; font-size: 12px; margin: 6px 0; }
    .totals .grand { font-weight: 800; font-size: 14px; }
    .note { margin-top: 14px; font-size: 12px; white-space: pre-line; }
    .signGrid { display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 14px; }
    .signBox { border: 1px solid #ddd; border-radius: 10px; padding: 12px; height: 110px; }
    .signLabel { font-size: 11px; color:#666; margin-bottom: 10px; }
    .dash { border-bottom: 1px dashed #bbb; height: 60px; }
    .footer { text-align:center; color:#777; font-size: 10px; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="top">
    <div class="shop">
      <div class="logoBox">${invoice.logo_url ? `<img src="${"http://localhost:5000" + invoice.logo_url}" style="max-width:78px; max-height:78px; object-fit:contain;" />` : "Logo"}</div>
      <div>
        <h1>${shopName}</h1>
        <div class="muted">${shopAddress}</div>
        <div class="muted">${shopPhone ? `Phone: ${shopPhone}` : ""}${shopPhone && shopEmail ? " • " : ""}${shopEmail ? `Email: ${shopEmail}` : ""}</div>
        ${taxId ? `<div class="muted">GST/HST: ${taxId}</div>` : ""}
      </div>
    </div>

    <div class="meta">
      <p class="title">INVOICE</p>
      <div class="row"><b>Invoice #:</b> ${escapeHtml(invoice.invoice_number)}</div>
      <div class="row"><b>Date:</b> ${escapeHtml(invoice.invoice_date)}</div>
      ${invoice.due_date ? `<div class="row"><b>Due:</b> ${escapeHtml(invoice.due_date)}</div>` : ""}
    </div>
  </div>

  <hr/>

  <div class="grid">
    <div class="card">
      <h3>Bill To</h3>
      <div class="line"><b>${customerName}</b></div>
      ${customerAddress ? `<div class="line muted">${customerAddress}</div>` : ""}
      <div class="line muted">${customerPhone ? `Phone: ${customerPhone}` : ""}${customerPhone && customerEmail ? " • " : ""}${customerEmail ? `Email: ${customerEmail}` : ""}</div>
    </div>

    <div class="card">
      <h3>Vehicle</h3>
      <div class="line"><b>VIN:</b> ${vin}</div>
      <div class="line"><b>Make/Model:</b> ${makeModel || "-"}</div>
      <div class="line"><b>Year:</b> ${year || "-"}</div>
      <div class="line"><b>Plate:</b> ${plate || "-"}</div>
      <div class="line"><b>Odometer:</b> ${odo || "-"}</div>
    </div>
  </div>

  <div style="margin-top:14px; border:1px solid #ddd; border-radius:10px; overflow:hidden;">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Type</th>
          <th>Condition</th>
          <th style="text-align:right;">Qty</th>
          <th style="text-align:right;">Unit</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || `<tr><td colspan="6" style="padding:14px; color:#666;">No items</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="totalsWrap">
    <div class="totals">
      <div class="row"><span>Subtotal</span><span><b>$${money(invoice.subtotal_amount)}</b></span></div>
      <div class="row"><span>HST (7%)</span><span><b>$${money(invoice.hst_amount)}</b></span></div>
      <div class="row"><span>PST (5%)</span><span><b>$${money(invoice.pst_amount)}</b></span></div>
      <div class="row grand"><span>Total</span><span>$${money(invoice.total_amount)}</span></div>
    </div>
  </div>

  ${note ? `<div class="note"><b>Note:</b><br/>${note}</div>` : ""}

  <div class="signGrid">
    <div class="signBox">
      <div class="signLabel">Customer Signature</div>
      <div class="dash"></div>
    </div>
    <div class="signBox">
      <div class="signLabel">Mechanic Signature</div>
      <div class="dash"></div>
    </div>
    <div class="signBox">
      <div class="signLabel">Stamp</div>
      <div style="height:60px; border:1px dashed #bbb; border-radius:8px;"></div>
    </div>
  </div>

  <div class="footer">Powered by GarageFlow</div>
</body>
</html>
`
}

export const invoicePdf = async (req, res) => {
  const shopId = req.shop.id
  const invoiceId = req.params.id

  try {
    // 1) Load invoice (shop-scoped) + joins
    const [invRows] = await pool.query(
      `
      SELECT
        i.*,DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS invoice_date,DATE_FORMAT(i.due_date, '%Y-%m-%d') AS due_date,
        s.shop_name, s.logo_url, s.shop_address, s.shop_phone, s.shop_email, s.tax_id,
        c.customer_name, c.customer_phone, c.customer_email, c.customer_address,
        v.vehicle_vin, v.make, v.model, v.year, v.license_plate
      FROM invoices i
      JOIN shops s ON s.id = i.shop_id
      JOIN customers c ON c.id = i.customer_id
      JOIN vehicles v ON v.id = i.vehicle_id
      WHERE i.id = ? AND i.shop_id = ?
      LIMIT 1
      `,
      [invoiceId, shopId]
    )

    if (!invRows.length) return res.status(404).json({ message: "Invoice not found" })
    const invoice = invRows[0]

    // 2) Load items
    const [items] = await pool.query(
      `SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC`,
      [invoiceId]
    )

    // 3) Render HTML
    const html = invoiceHtml({ invoice, items })

    // 4) Generate PDF via Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // needed on many servers
    })

    try {
      const page = await browser.newPage()

      // allow loading local images or remote logo_url
      await page.setContent(html, { waitUntil: "networkidle0" })

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
      })

      // 5) Send as download
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${invoice.invoice_number}.pdf"`
      )
      return res.send(pdf)
    } finally {
      await browser.close()
    }
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "PDF generation failed" })
  }
}
// GET /api/invoices?status=&q=&from=&to=
export const listInvoices = async (req, res) => {
  const shopId = req.shop.id
  const { status, q, from, to } = req.query

  try {
    let sql = `
      SELECT
        i.id,
        i.invoice_number,
        DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS invoice_date,
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
        i.*,DATE_FORMAT(i.invoice_date, '%Y-%m-%d') AS invoice_date,DATE_FORMAT(i.due_date, '%Y-%m-%d') AS due_date,
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
 *   subtotal_amount,hst_amount,pst_amount, tax_amount, total_amount,note,
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
    hst_amount,
    pst_amount,
    note,
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
         subtotal_amount,hst_amount, pst_amount, tax_amount, total_amount, status, warranty_statement, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        hst_amount ?? 0,
        pst_amount ?? 0,
        tax_amount,
        total_amount,
        status,
        warranty_statement || "90 days or 5,000 km",
        note || null,
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

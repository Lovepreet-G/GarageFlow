import pool from "../config/db.js"
import puppeteer from "puppeteer"

const escapeHtml = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

// GET /api/employees?q=
export const listEmployees = async (req, res) => {
  const shopId = req.shop.id
  const q = (`%${(req.query.q || "").trim()}%`).replaceAll("%", "%%")

  try {
    const [rows] = await pool.query(
      `SELECT 
        id, first_name, last_name, mobile, email, hourly_rate, job_type, department_id, sin_number, status,
        created_at, updated_at, deleted_at,
        address_street, address_unit, address_city, address_province, address_country, address_postal_code
       FROM employees
       WHERE shop_id = ?
         AND (
           CONCAT(first_name, ' ', COALESCE(last_name, '')) LIKE ?
           OR email LIKE ?
           OR mobile LIKE ?
         )
       ORDER BY id DESC`,
      [shopId, q, q, q]
    )

    res.json({ employees: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// GET /api/employees/:id
export const getEmployeeById = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params

  try {
    const [rows] = await pool.query(
      `SELECT 
        id, first_name, last_name, mobile, email, hourly_rate, job_type, department_id, sin_number, status,
        created_at, updated_at, deleted_at,
        address_street, address_unit, address_city, address_province, address_country, address_postal_code
       FROM employees
       WHERE id = ? AND shop_id = ?`,
      [id, shopId]
    )

    if (!rows.length) return res.status(404).json({ message: "Employee not found" })
    res.json({ employee: rows[0] })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// POST /api/employees
export const createEmployee = async (req, res) => {
  const shopId = req.shop.id

  const {
    first_name,
    last_name,
    mobile,
    email,
    hourly_rate,
    department_id,
    sin_number,
    job_type,
    created_at, // ✅ start date set by employer

    // ✅ Address fields
    address_street,
    address_unit,
    address_city,
    address_province,
    address_country,
    address_postal_code,
  } = req.body

  if (!first_name) return res.status(400).json({ message: "First name required" })
  if (!sin_number) return res.status(400).json({ message: "SIN required" })
  if (!created_at) return res.status(400).json({ message: "Start date required" })

  try {
    const [result] = await pool.query(
      `INSERT INTO employees (
        shop_id, first_name, last_name, mobile, email, hourly_rate, department_id, sin_number, job_type, created_at,
        address_street, address_unit, address_city, address_province, address_country, address_postal_code
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shopId,
        first_name,
        last_name || null,
        mobile || null,
        email || null,
        hourly_rate || null,
        department_id || null,
        sin_number,
        job_type || null,
        created_at,

        address_street || null,
        address_unit || null,
        address_city || null,
        address_province || null,
        address_country || null,
        address_postal_code || null,
      ]
    )

    res.status(201).json({ id: result.insertId })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server insert error" })
  }
}

// PATCH /api/employees/:id
export const updateEmployee = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params

  const {
    first_name,
    last_name,
    mobile,
    email,
    hourly_rate,
    department_id,
    job_type,
    sin_number,
    status,

    // ✅ Address fields
    address_street,
    address_unit,
    address_city,
    address_province,
    address_country,
    address_postal_code,
  } = req.body

  try {
    const [check] = await pool.query(
      `SELECT id FROM employees WHERE id = ? AND shop_id = ? AND deleted_at IS NULL`,
      [id, shopId]
    )
    if (!check.length) return res.status(404).json({ message: "Employee not found" })

    await pool.query(
      `UPDATE employees 
       SET first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name),
           mobile = COALESCE(?, mobile),
           email = COALESCE(?, email),
           hourly_rate = COALESCE(?, hourly_rate),
           department_id = COALESCE(?, department_id),
           job_type = COALESCE(?, job_type),
           sin_number = COALESCE(?, sin_number),
           status = COALESCE(?, status),

           address_street = COALESCE(?, address_street),
           address_unit = COALESCE(?, address_unit),
           address_city = COALESCE(?, address_city),
           address_province = COALESCE(?, address_province),
           address_country = COALESCE(?, address_country),
           address_postal_code = COALESCE(?, address_postal_code)
       WHERE id = ? AND shop_id = ?`,
      [
        first_name,
        last_name,
        mobile,
        email,
        hourly_rate,
        department_id,
        job_type,
        sin_number,
        status,

        address_street,
        address_unit,
        address_city,
        address_province,
        address_country,
        address_postal_code,

        id,
        shopId,
      ]
    )

    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

// DELETE /api/employees/:id (soft deactivate ONLY)
export const softDeleteEmployee = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params

  try {
    const [check] = await pool.query(
      `SELECT id FROM employees WHERE id = ? AND shop_id = ? AND deleted_at IS NULL`,
      [id, shopId]
    )
    if (!check.length) return res.status(404).json({ message: "Employee not found" })

    // ✅ remove = deactivate
    await pool.query(
      `UPDATE employees SET status = 'inactive' WHERE id = ? AND shop_id = ?`,
      [id, shopId]
    )

    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}
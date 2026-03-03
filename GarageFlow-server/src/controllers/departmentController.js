import pool from "../config/db.js"

export const listDepartments = async (req, res) => {
  const shopId = req.shop.id
  try {
    const [rows] = await pool.query(`SELECT * FROM departments WHERE shop_id = ? AND deleted_at IS NULL ORDER BY name`, [shopId])
    res.json({ departments: rows })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createDepartment = async (req, res) => {
  const shopId = req.shop.id
  const { name, description } = req.body
  if (!name) return res.status(400).json({ message: 'name required' })
  try {
    const [result] = await pool.query(`INSERT INTO departments (shop_id, name, description) VALUES (?, ?, ?)`, [shopId, name, description || null])
    res.status(201).json({ id: result.insertId })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateDepartment = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  const { name, description } = req.body
  try {
    const [check] = await pool.query(`SELECT id FROM departments WHERE id = ? AND shop_id = ?`, [id, shopId])
    if (!check.length) return res.status(404).json({ message: 'Department not found' })
    await pool.query(`UPDATE departments SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ? AND shop_id = ?`, [name, description, id, shopId])
    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteDepartment = async (req, res) => {
  const shopId = req.shop.id
  const { id } = req.params
  try {
    const [check] = await pool.query(`SELECT id FROM departments WHERE id = ? AND shop_id = ?`, [id, shopId])
    if (!check.length) return res.status(404).json({ message: 'Department not found' })
    await pool.query(`UPDATE departments SET deleted_at = NOW() WHERE id = ? AND shop_id = ?`, [id, shopId])
    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Server error' })
  }
}

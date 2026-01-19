import pool from '../config/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const registerShop = async (req, res) => {
  const { shop_name, shop_address, shop_phone, shop_email, password, tax_id } = req.body

  try {
    const [exists] = await pool.query(
      'SELECT id FROM shops WHERE shop_email = ?',
      [shop_email]
    )

    if (exists.length)
      return res.status(400).json({ message: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)

    await pool.query(
      `INSERT INTO shops (shop_name, shop_address, shop_phone, shop_email, password_hash, tax_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [shop_name, shop_address, shop_phone, shop_email, hash, tax_id]
    )

    res.status(201).json({ message: 'Shop registered successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const loginShop = async (req, res) => {
  const { shop_email, password } = req.body

  try {
    const [rows] = await pool.query(
      'SELECT * FROM shops WHERE shop_email = ?',
      [shop_email]
    )

    if (!rows.length)
      return res.status(401).json({ message: 'Invalid credentials' })

    const shop = rows[0]

    const match = await bcrypt.compare(password, shop.password_hash)
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign(
      { id: shop.id, shop_name: shop.shop_name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    res.json({ token, shop: { id: shop.id, shop_name: shop.shop_name } })
  } catch {
    res.status(500).json({ message: 'Server error' })
  }
}
export const me = async (req, res) => {
  // req.shop comes from middleware
  res.json({ shop: req.shop })
}

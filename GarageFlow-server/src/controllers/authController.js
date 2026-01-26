import pool from '../config/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import fs from "fs"
import path from "path"
import { makeResetToken } from "../utils/passwordReset.js"
import crypto from "crypto"
import { sendMail } from '../utils/mailer.js'

export const registerShop = async (req, res) => {
  const { shop_name, shop_address, shop_phone, shop_email, password, tax_id } = req.body

  try {
    const [exists] = await pool.query(
      "SELECT id FROM shops WHERE shop_email = ?",
      [shop_email]
    )

    if (exists.length) {
      // cleanup temp file if email already exists
      if (req.file) fs.unlinkSync(req.file.path)
      return res.status(400).json({ message: "Email already registered" })
    }

    const hash = await bcrypt.hash(password, 10)

    const [result] = await pool.query(
      `INSERT INTO shops 
       (shop_name, shop_address, shop_phone, shop_email, password_hash, tax_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [shop_name, shop_address, shop_phone, shop_email, hash, tax_id || null]
    )

    const shopId = result.insertId
    let logoUrl = null

    // ✅ handle logo if uploaded
    if (req.file) {
      const ext = path.extname(req.file.originalname)
      const newName = `shop_${shopId}${ext}`
      const newPath = `uploads/logos/${newName}`

      fs.renameSync(req.file.path, newPath)
      logoUrl = `/uploads/logos/${newName}`

      await pool.query(
        "UPDATE shops SET logo_url = ? WHERE id = ?",
        [logoUrl, shopId]
      )
    }

    res.status(201).json({
      message: "Shop registered successfully",
      shopId,
      logo_url: logoUrl,
    })
  } catch (err) {
    console.error(err)
    if (req.file) fs.unlinkSync(req.file.path)
    res.status(500).json({ message: "Server error" })
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

// 1) request reset
export const requestPasswordReset = async (req, res) => {
  const { shop_email } = req.body
  if (!shop_email) return res.status(400).json({ message: "Email is required" })

  try {
    const [shops] = await pool.query(
      "SELECT id, shop_name, shop_email FROM shops WHERE shop_email = ?",
      [shop_email]
    )

    // Always respond same (don’t reveal if email exists)
    const okMsg = "If the email exists, a reset link has been sent."

    if (!shops.length) return res.json({ message: okMsg })

    const shop = shops[0]
    const { token, token_hash } = makeResetToken()

    // 30 min expiry
    await pool.query(
      `INSERT INTO password_resets (shop_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
      [shop.id, token_hash]
    )

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    const subject = "Reset your GarageFlow password"
    const text =
    `Hi ${shop.shop_name},

    We received a request to reset your GarageFlow password.

    Reset link (valid for 30 minutes):
    ${resetLink}

    If you didn't request this, you can ignore this email.`

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 12px 0;">Reset your GarageFlow password</h2>
        <p>Hi <b>${shop.shop_name}</b>,</p>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetLink}"
             style="display:inline-block;padding:10px 16px;background:#0f172a;color:#fff;
                    text-decoration:none;border-radius:8px;">
            Reset Password
          </a>
        </p>
        <p style="color:#475569;font-size:13px;margin-top:14px;">
          This link is valid for 30 minutes. If you didn't request this, you can ignore this email.
        </p>
        <p style="color:#94a3b8;font-size:12px;">GarageFlow</p>
      </div>
    `

    await sendMail({
      to: shop.shop_email,
      subject,
      text,
      html,
    })

    return res.json({ message: okMsg })
  } catch (err) {
    console.error(err)
    // still don’t reveal details
    return res.json({ message: "If the email exists, a reset link has been sent." })
  }
}

// 2) confirm reset
export const confirmPasswordReset = async (req, res) => {
  const { token, new_password } = req.body

  if (!token || !new_password) {
    return res.status(400).json({ message: "Token and new password are required" })
  }

  // basic password rules (same rules we’ll reuse in profile update)
  if (new_password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" })
  }

  try {
    const token_hash = crypto.createHash("sha256").update(token).digest("hex")

    const [rows] = await pool.query(
      `SELECT id, shop_id
       FROM password_resets
       WHERE token_hash = ?
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [token_hash]
    )

    if (!rows.length) {
      return res.status(400).json({ message: "Reset link is invalid or expired" })
    }

    const resetRow = rows[0]
    const hash = await bcrypt.hash(new_password, 10)

    await pool.query("UPDATE shops SET password_hash = ? WHERE id = ?", [hash, resetRow.shop_id])
    await pool.query("UPDATE password_resets SET used_at = NOW() WHERE id = ?", [resetRow.id])

    res.json({ message: "Password updated successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}

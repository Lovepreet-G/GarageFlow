import pool from "../config/db.js"
import fs from "fs"
import path from "path"
import bcrypt from "bcrypt"
import { getSubscriptionSnapshot } from "../services/subscriptionService.js"

export const getMyShopProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, shop_name, shop_email, shop_address, shop_phone, tax_id, logo_url
       FROM shops
       WHERE id = ?
       LIMIT 1`,
      [req.shop.id]
    )

    if (!rows.length) return res.status(404).json({ message: "Shop not found." })

    const snapshot = await getSubscriptionSnapshot(req.shop.id)
    res.json({ shop: rows[0], ...snapshot })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to load shop profile." })
  }
}

export const setMyTaxId = async (req, res) => {
  const taxId = String(req.body?.tax_id || "").trim()

  if (!taxId) {
    return res.status(400).json({ message: "Tax ID is required." })
  }

  if (taxId.length > 64) {
    return res.status(400).json({ message: "Tax ID must be 64 characters or fewer." })
  }

  try {
    const [result] = await pool.query(
      `UPDATE shops
       SET tax_id = ?
       WHERE id = ?
         AND (tax_id IS NULL OR TRIM(tax_id) = '')`,
      [taxId, req.shop.id]
    )

    if (!result.affectedRows) {
      const [rows] = await pool.query("SELECT tax_id FROM shops WHERE id = ? LIMIT 1", [req.shop.id])
      if (!rows.length) return res.status(404).json({ message: "Shop not found." })
      return res.status(409).json({ message: "Tax ID has already been set and cannot be changed." })
    }

    res.json({ message: "Tax ID saved.", tax_id: taxId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to save tax ID." })
  }
}

export const updateShopLogo = async (req, res) => {
  const shopId = req.shop.id

  if (!req.file) {
    return res.status(400).json({ message: "Logo file is required" })
  }

  try {
    // get old logo (optional cleanup)
    const [rows] = await pool.query(
      "SELECT logo_url FROM shops WHERE id = ?",
      [shopId]
    )
    const oldLogoUrl = rows?.[0]?.logo_url || null

    const ext = path.extname(req.file.originalname) || ".png"
    const newName = `shop_${shopId}${ext}`
    const newPath = `uploads/logos/${newName}`
    const newUrl = `/uploads/logos/${newName}`

    // overwrite if exists
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath)
    fs.renameSync(req.file.path, newPath)

    // (optional) delete old file if it had a different extension/name
    if (oldLogoUrl && oldLogoUrl !== newUrl) {
      const oldPath = oldLogoUrl.startsWith("/") ? oldLogoUrl.slice(1) : oldLogoUrl
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
    }

    await pool.query("UPDATE shops SET logo_url = ? WHERE id = ?", [newUrl, shopId])

    res.json({ message: "Logo updated", logo_url: newUrl })
  } catch (err) {
    console.error(err)
    // cleanup temp upload
    try {
      fs.unlinkSync(req.file.path)
    } catch {}
    res.status(500).json({ message: "Server error" })
  }
}

export const updateMyPassword = async (req, res) => {
  const shopId = req.shop.id
  const { current_password, new_password } = req.body

  if (!current_password || !new_password) {
    return res.status(400).json({ message: "Current password and new password are required." })
  }

  if (new_password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." })
  }

  try {
    const [rows] = await pool.query(
      "SELECT password_hash FROM shops WHERE id = ?",
      [shopId]
    )

    if (!rows.length) return res.status(404).json({ message: "Shop not found." })

    const ok = await bcrypt.compare(current_password, rows[0].password_hash)
    if (!ok) return res.status(400).json({ message: "Current password is incorrect." })

    const hash = await bcrypt.hash(new_password, 10)
    await pool.query("UPDATE shops SET password_hash = ? WHERE id = ?", [hash, shopId])

    res.json({ message: "Password updated successfully." })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}

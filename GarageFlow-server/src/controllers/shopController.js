import pool from "../config/db.js"
import fs from "fs"
import path from "path"

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

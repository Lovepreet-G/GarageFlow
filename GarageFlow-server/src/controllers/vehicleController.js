import pool from "../config/db.js"

export const createVehicle = async (req, res) => {
  const shopId = req.shop.id
  const { customer_id, vehicle_vin, make, model, year, license_plate } = req.body
  const normalizedVin = String(vehicle_vin || "").trim() || null

  if (!customer_id) {
    return res.status(400).json({ message: "customer_id required" })
  }

  try {
    // Ensure customer belongs to shop
    const [c] = await pool.query(
      "SELECT id FROM customers WHERE id = ? AND shop_id = ?",
      [customer_id, shopId]
    )
    if (!c.length) return res.status(400).json({ message: "Customer not found" })

    const [result] = await pool.query(
      `INSERT INTO vehicles (shop_id, customer_id, vehicle_vin, make, model, year, license_plate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [shopId, customer_id, normalizedVin, make || null, model || null, year || null, license_plate || null]
    )

    res.status(201).json({ id: result.insertId })
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Vehicle VIN already exists" })
    }
    console.error(e)
    res.status(500).json({ message: "Server error" })
  }
}

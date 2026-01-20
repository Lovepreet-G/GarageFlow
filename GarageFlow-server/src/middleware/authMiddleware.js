import jwt from "jsonwebtoken"

export const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization // "Bearer <token>"
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" })
    }

    const token = header.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach shop info to request
    req.shop = {
      id: decoded.id,
      shop_name: decoded.shop_name,
    }

    next()
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" })
  }
}
 
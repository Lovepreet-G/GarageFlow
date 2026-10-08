import jwt from "jsonwebtoken"

function getAdminSecret() {
  return process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
}

export function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid admin token" })
    }

    const token = header.split(" ")[1]
    const decoded = jwt.verify(token, getAdminSecret())

    if (decoded?.token_type !== "admin" || decoded?.role !== "super_admin") {
      return res.status(403).json({ message: "Admin access is required" })
    }

    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    return res.status(401).json({ message: "Admin token invalid or expired" })
  }
}

import express from "express"
import cors from "cors"
import rateLimit from "express-rate-limit"

import authRoutes from "./routes/authRoutes.js"
import invoiceRoutes from "./routes/invoiceRoutes.js"
import customerRoutes from "./routes/customerRoutes.js"
import vehicleRoutes from "./routes/vehicleRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import shopRoutes from "./routes/shopRoutes.js"

const app = express()

app.set("trust proxy", 1) // ✅ important if deployed behind proxy (Render, Railway, etc.)

app.use(cors())
app.use(express.json())

/**
 * ✅ Rate limit for auth endpoints (login / forgot / reset)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30, // total requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
})

/**
 * ✅ Extra strict for forgot-password (prevents email spam)
 */
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reset requests. Please try again in an hour." },
})

/**
 * ✅ Extra strict for login attempts
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // 10 login attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
})

// ---------------- ROUTES ----------------
app.use("/uploads", express.static("uploads"))

app.use("/api/auth", authLimiter, authRoutes)

// ✅ apply strict limiter only to specific auth endpoints

app.use("/api/auth/forgot-password", forgotLimiter)
app.use("/api/auth/login", loginLimiter)

app.use("/api/invoices", invoiceRoutes)
app.use("/api/customers", customerRoutes)
app.use("/api/vehicles", vehicleRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/shops", shopRoutes)

app.listen(5000, () => {
  console.log("GarageFlow API running on http://localhost:5000")
})

import express from "express"
import cors from "cors"
import rateLimit from "express-rate-limit"
import path from "path"
import { fileURLToPath } from "url"

import authRoutes from "./routes/authRoutes.js"
import invoiceRoutes from "./routes/invoiceRoutes.js"
import customerRoutes from "./routes/customerRoutes.js"
import vehicleRoutes from "./routes/vehicleRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import shopRoutes from "./routes/shopRoutes.js"
import employeeRoutes from "./routes/employeeRoutes.js"
import departmentRoutes from "./routes/departmentRoutes.js"
import scheduleRoutes from "./routes/scheduleRoutes.js"
import attendanceRoutes from "./routes/attendanceRoutes.js"
import payrollRoutes from "./routes/payrollRoutes.js"
import subscriptionRoutes from "./routes/subscriptionRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.set("trust proxy", 1)

app.use(cors())
app.use("/api/subscriptions/webhook", express.raw({ type: "application/json" }))
app.use(express.json())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
})

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reset requests. Please try again in an hour." },
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
})

app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")))

app.use("/api/auth", authLimiter, authRoutes)
app.use("/api/auth/forgot-password", forgotLimiter)
app.use("/api/auth/login", loginLimiter)

app.use("/api/invoices", invoiceRoutes)
app.use("/api/customers", customerRoutes)
app.use("/api/vehicles", vehicleRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/shops", shopRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/departments", departmentRoutes)
app.use("/api/schedules", scheduleRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/payroll", payrollRoutes)
app.use("/api/subscriptions", subscriptionRoutes)
app.use("/api/admin", adminRoutes)

app.listen(5000, () => {
  console.log("GarageFlow API running on http://localhost:5000")
})

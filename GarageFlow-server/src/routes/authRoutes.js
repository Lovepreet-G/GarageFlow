import express from "express"
import rateLimit from "express-rate-limit"

import {
  registerShop,
  loginShop,
  requestPasswordReset,
  confirmPasswordReset,
} from "../controllers/authController.js"

import { uploadLogo } from "../middleware/uploadLogo.js"

const router = express.Router()

/**
 * 🔐 Login rate limiter
 * 10 attempts per 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
})

/**
 * 📧 Forgot password limiter
 * 5 requests per hour
 */
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset requests. Please try again in an hour.",
  },
})

/**
 * 🛡️ General auth limiter (register / reset-password)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
})

// ---------- ROUTES ----------

router.post("/register", authLimiter, uploadLogo.single("logo"), registerShop)

router.post("/login", loginLimiter, loginShop)

router.post("/forgot-password", forgotLimiter, requestPasswordReset)

router.post("/reset-password", authLimiter, confirmPasswordReset)

export default router

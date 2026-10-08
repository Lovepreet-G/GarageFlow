import express from "express"
import rateLimit from "express-rate-limit"

import {
  adminLogin,
  getAdminMe,
  getAdminLogs,
  getAdminShops,
  getAdminStats,
  overrideShopPlan,
  removeLifetime,
  removeOverride,
  setLifetimeAccess,
} from "../controllers/adminController.js"
import { requireAdmin } from "../middleware/adminAuthMiddleware.js"

const router = express.Router()

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many admin login attempts. Please try again later." },
})

const adminActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many admin requests. Please try again later." },
})

router.post("/login", adminLoginLimiter, adminLogin)

router.use(adminActionLimiter)
router.use(requireAdmin)

router.get("/me", getAdminMe)
router.get("/stats", getAdminStats)
router.get("/shops", getAdminShops)
router.get("/logs", getAdminLogs)
router.post("/override-plan", overrideShopPlan)
router.post("/set-lifetime", setLifetimeAccess)
router.post("/remove-override", removeOverride)
router.post("/remove-lifetime", removeLifetime)

export default router

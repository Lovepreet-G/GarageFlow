import express from "express"
import { registerShop, loginShop, me } from "../controllers/authController.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = express.Router()
// All routes below require login


router.post("/register", registerShop)
router.post("/login", loginShop)

// ✅ Protected test route
//router.get("/", requireAuth, ...)
router.get("/me", requireAuth, me)

export default router

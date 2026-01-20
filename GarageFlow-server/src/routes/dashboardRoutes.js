import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { getDashboard } from "../controllers/dashboardController.js"

const router = express.Router()
router.use(requireAuth)

router.get("/", getDashboard) // GET /api/dashboard?month=1&year=2026&weekStart=2026-01-12

export default router
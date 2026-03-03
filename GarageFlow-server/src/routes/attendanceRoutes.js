import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { listAttendance } from "../controllers/attendanceController.js"

const router = express.Router()
router.use(requireAuth)

router.get("/", listAttendance)

export default router

import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { listSchedules, createSchedule, updateSchedule, deleteSchedule , downloadWeeklySchedulePdf } from "../controllers/scheduleController.js"

const router = express.Router()
router.use(requireAuth)

router.get("/", listSchedules)
router.post("/", createSchedule)
router.put("/:id", updateSchedule)
router.delete("/:id", deleteSchedule)
router.get("/download-pdf", downloadWeeklySchedulePdf)

export default router

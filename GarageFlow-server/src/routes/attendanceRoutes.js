import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { checkSubscription } from "../middleware/subscriptionMiddleware.js"
import { listAttendance , updateAttendance} from "../controllers/attendanceController.js"

const router = express.Router()
router.use(requireAuth)
router.use(checkSubscription({ requiredPlan: "pro" }))

router.get("/", listAttendance)
router.patch("/:id", updateAttendance)

export default router

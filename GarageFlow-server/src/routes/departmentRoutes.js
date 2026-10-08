import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { checkSubscription } from "../middleware/subscriptionMiddleware.js"
import { listDepartments, createDepartment, updateDepartment, deleteDepartment } from "../controllers/departmentController.js"

const router = express.Router()
router.use(requireAuth)
router.use(checkSubscription({ requiredPlan: "pro" }))

router.get("/", listDepartments)
router.post("/", createDepartment)
router.put("/:id", updateDepartment)
router.delete("/:id", deleteDepartment)

export default router

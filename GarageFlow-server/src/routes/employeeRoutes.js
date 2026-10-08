import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { checkSubscription } from "../middleware/subscriptionMiddleware.js"
import {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  softDeleteEmployee,
//   listSchedules,
//   createSchedules,
//   schedulePdf,
} from "../controllers/employeeController.js"

const router = express.Router()

router.use(requireAuth)
router.use(checkSubscription({ requiredPlan: "pro" }))

router.get("/", listEmployees)
router.post("/", createEmployee)
router.get("/:id", getEmployeeById)
router.patch("/:id", updateEmployee)
router.delete("/:id", softDeleteEmployee)

export default router

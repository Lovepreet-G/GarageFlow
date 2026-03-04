import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
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

router.get("/", listEmployees)
router.post("/", createEmployee)
router.get("/:id", getEmployeeById)
router.patch("/:id", updateEmployee)
router.delete("/:id", softDeleteEmployee)

// schedules
// router.get("/:id/schedules", listSchedules)
// router.post("/:id/schedules", createSchedules)
// router.get("/:id/schedule/pdf", schedulePdf)

export default router

import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import {
  downloadPayrollPdf,
  downloadEmployeePayrollPdf,
  finalizePayroll,
  getEmployeePayrollHistory,
  getPayrollSummary,
  markPayrollPaid,
  savePayrollDraft,
} from "../controllers/payrollController.js"

const router = express.Router()
router.use(requireAuth)

router.get("/", getPayrollSummary)
router.get("/employees/:employeeId/history", getEmployeePayrollHistory)
router.get("/employees/:employeeId/download-pdf", downloadEmployeePayrollPdf)
router.post("/save", savePayrollDraft)
router.post("/finalize", finalizePayroll)
router.post("/pay", markPayrollPaid)
router.get("/download-pdf", downloadPayrollPdf)

export default router

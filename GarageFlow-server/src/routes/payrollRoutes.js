import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import {
  downloadPayrollPdf,
  finalizePayroll,
  getPayrollSummary,
  savePayrollDraft,
} from "../controllers/payrollController.js"

const router = express.Router()
router.use(requireAuth)

router.get("/", getPayrollSummary)
router.post("/save", savePayrollDraft)
router.post("/finalize", finalizePayroll)
router.get("/download-pdf", downloadPayrollPdf)

export default router

import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import {
  listInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  createInvoice,
} from "../controllers/invoiceController.js"

const router = express.Router()

// All invoice routes require login
// router.use(requireAuth)

// List + filters
router.get("/", listInvoices)

// Single invoice for view/print
router.get("/:id", getInvoiceById)

// Update status dropdown
router.patch("/:id/status", updateInvoiceStatus)

// Create invoice (basic)
router.post("/", createInvoice)

export default router

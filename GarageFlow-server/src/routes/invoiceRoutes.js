import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import {
  listInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  createInvoice,
    invoicePdf,
} from "../controllers/invoiceController.js"

const router = express.Router()

// All invoice routes require login
router.use(requireAuth)

// List + filters
router.get("/", listInvoices)

// Single invoice for view
router.get("/:id", getInvoiceById)

// Single invoice for print
router.get("/:id/pdf", invoicePdf)


// Update status dropdown
router.patch("/:id/status", updateInvoiceStatus)

// Create invoice (basic)
router.post("/", createInvoice)

export default router

import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { checkSubscription } from "../middleware/subscriptionMiddleware.js"
import {
  listInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  createInvoice,
    invoicePdf,
} from "../controllers/invoiceController.js"

const router = express.Router()

router.use(requireAuth)
router.use(checkSubscription())
router.get("/", listInvoices)
router.get("/:id", getInvoiceById)
router.get("/:id/pdf", invoicePdf)
router.patch("/:id/status", updateInvoiceStatus)
router.post("/", createInvoice)

export default router

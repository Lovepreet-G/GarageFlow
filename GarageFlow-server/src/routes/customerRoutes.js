import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { listCustomers, createCustomer, listCustomerVehicles } from "../controllers/customerController.js"

const router = express.Router()
router.use(requireAuth)

router.get("/", listCustomers)               // GET /api/customers?q=
router.post("/", createCustomer)             // POST /api/customers
router.get("/:id/vehicles", listCustomerVehicles) // GET /api/customers/:id/vehicles

export default router
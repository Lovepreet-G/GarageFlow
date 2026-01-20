import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import {
  listCustomers,
  getCustomerById,
  listCustomerVehicles,
  getCustomerHistory,
  createCustomer,
} from "../controllers/customerController.js"
const router = express.Router()
router.use(requireAuth)

router.get("/", listCustomers)               // GET /api/customers?q=
router.post("/", createCustomer)             // POST /api/customers
router.get("/:id/vehicles", listCustomerVehicles) // GET /api/customers/:id/vehicles
router.get("/:id", getCustomerById)         // GET /api/customers/:id
router.get("/:id/history", getCustomerHistory) // GET /api/customers/:id/history

export default router
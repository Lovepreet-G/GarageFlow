import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { createVehicle } from "../controllers/vehicleController.js"

const router = express.Router()
router.use(requireAuth)

router.post("/", createVehicle) // POST /api/vehicles

export default router

import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { checkSubscription } from "../middleware/subscriptionMiddleware.js"
import { createVehicle } from "../controllers/vehicleController.js"

const router = express.Router()
router.use(requireAuth)
router.use(checkSubscription())

router.post("/", createVehicle) // POST /api/vehicles

export default router

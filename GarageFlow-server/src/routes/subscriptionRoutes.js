import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import {
  createCheckoutSession,
  createCustomerPortalSession,
  getMySubscription,
  handleStripeWebhook,
} from "../controllers/subscriptionController.js"

const router = express.Router()

router.post("/webhook", handleStripeWebhook)
router.use(requireAuth)
router.get("/me", getMySubscription)
router.post("/create-checkout-session", createCheckoutSession)
router.post("/create-portal-session", createCustomerPortalSession)

export default router

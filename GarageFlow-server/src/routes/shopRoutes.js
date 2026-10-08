import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { checkSubscription } from "../middleware/subscriptionMiddleware.js"
import { uploadLogo } from "../middleware/uploadLogo.js"
import { updateShopLogo , updateMyPassword } from "../controllers/shopController.js"

const router = express.Router()

router.use(requireAuth)
router.use(checkSubscription())

router.patch("/me/logo", uploadLogo.single("logo"), updateShopLogo)
router.patch("/me/password", updateMyPassword)

export default router

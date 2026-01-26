import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { uploadLogo } from "../middleware/uploadLogo.js"
import { updateShopLogo , updateMyPassword } from "../controllers/shopController.js"

const router = express.Router()

router.patch("/me/logo", requireAuth, uploadLogo.single("logo"), updateShopLogo)
router.patch("/me/password", requireAuth, updateMyPassword)

export default router
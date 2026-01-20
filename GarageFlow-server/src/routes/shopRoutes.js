import express from "express"
import { requireAuth } from "../middleware/requireAuth.js"
import { uploadLogo } from "../middleware/uploadLogo.js"
import { updateShopLogo } from "../controllers/shopController.js"

const router = express.Router()

router.patch("/me/logo", requireAuth, uploadLogo.single("logo"), updateShopLogo)

export default router
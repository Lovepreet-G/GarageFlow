import express from "express"
import { requireAuth } from "../middleware/authMiddleware.js"
import { uploadLogo } from "../middleware/uploadLogo.js"
import {
  getMyShopProfile,
  setMyTaxId,
  updateMyPassword,
  updateShopLogo,
} from "../controllers/shopController.js"

const router = express.Router()

router.use(requireAuth)

router.get("/me", getMyShopProfile)
router.patch("/me/tax-id", setMyTaxId)
router.patch("/me/logo", uploadLogo.single("logo"), updateShopLogo)
router.patch("/me/password", updateMyPassword)

export default router

import express from "express"
import { registerShop, loginShop} from "../controllers/authController.js"
import { uploadLogo } from "../middleware/uploadLogo.js"

const router = express.Router()
// All routes below require login


router.post("/register", uploadLogo.single("logo"), registerShop)
router.post("/login", loginShop)



export default router

import { Router } from "express";
import {upload} from "../middlewares/multer.middlewares.js"
import { loginUser, logoutUser, refreshingAccessToken, registerUser } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router =Router()

//register
router.route("/register").post(
    upload.fields([
       { name:"profileImage",
        maxCount:1}
    ]),
    registerUser
)

//login
router.route("/login").post(loginUser)

//secure route
//logout
router.route("/logout").post(verifyJWT,logoutUser)
//refresh the tokens
router.route("/refresh-tokens").post(refreshingAccessToken)

export default router
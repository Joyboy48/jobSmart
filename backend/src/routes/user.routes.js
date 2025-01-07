import { Router } from "express";
import {upload} from "../middlewares/multer.middlewares.js"
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshingAccessToken, registerUser, updateAccountDetails } from "../controllers/user.controllers.js";
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
//change password
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
//current user
router.route("/get-current-user").get(verifyJWT,getCurrentUser)
//update details
router.route("/update-user-details").post(verifyJWT,updateAccountDetails)

export default router
import { Router } from "express";
import {upload} from "../middlewares/multer.middlewares.js"
import { loginUser, logoutUser, registerUser } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router =Router()

router.route("/register").post(
    upload.fields([
       { name:"profileImage",
        maxCount:1}
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secure route
router.route("/logout").post(verifyJWT,logoutUser)

export default router
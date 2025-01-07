import { Router } from "express";
import {upload} from "../middlewares/multer.middlewares.js"
import { loginUser, registerUser } from "../controllers/user.controllers.js";

const router =Router()

router.route("/register").post(
    upload.fields([
       { name:"profileImage",
        maxCount:1}
    ]),
    registerUser
)

router.route("/login").post(loginUser)

export default router
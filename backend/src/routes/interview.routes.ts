import express from "express";
import { startInterview, answerInterview, endInterview } from "../controllers/interview.controller.js";
import { authenticate } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.use(authenticate); // Protect all interview routes

router.post("/start", startInterview);
router.post("/answer", answerInterview);
router.post("/end", endInterview);

export default router; 
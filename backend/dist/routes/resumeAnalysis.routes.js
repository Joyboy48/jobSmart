import express from "express";
import { authenticate } from "../middlewares/auth.middlewares.js";
import { analyzeResume } from "../controllers/resumeAnalysis.controller.js";
const router = express.Router();
router.post("/resume-analysis", authenticate, analyzeResume);
export default router;

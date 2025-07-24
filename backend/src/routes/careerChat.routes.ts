import { Router } from "express";
import {careerChat}  from "../controllers/careerChat.controller.js";

const router = Router();

router.post("/chat", careerChat);

export default router; 
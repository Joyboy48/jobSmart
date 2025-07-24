import express from "express";
import { authenticate } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {
  getCurrentUser,
  updateAccountDetails,
  updateProfileImage,
  getUserById,
  updateBio,
  updateLocation,
  updateSkills,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  updateResume,
  getAiInsights,
  updateJobPreference,
  deleteResume,
} from "../controllers/user.controllers.js";
import { skillGapAnalysis } from "../controllers/skillGap.controller.js";
import { getJobRecommendations } from "../controllers/jobRecommendation.controller.js";

const router = express.Router();

// Protected routes
router.get("/get-current-user", authenticate, getCurrentUser);
router.post("/update-user-details", authenticate, updateAccountDetails);
router.patch("/updateProfileImage", authenticate, upload.single("profileImage"), updateProfileImage);
router.patch("/update-bio", authenticate, updateBio);
router.patch("/update-location", authenticate, updateLocation);
router.patch("/update-skills", authenticate, updateSkills);
router.patch("/update-job-preference", authenticate, updateJobPreference);

// Experience
router.post("/experience", authenticate, addExperience);
router.put("/experience/:expId", authenticate, updateExperience);
router.delete("/experience/:expId", authenticate, deleteExperience);

// Education
router.post("/education", authenticate, addEducation);
router.put("/education/:eduId", authenticate, updateEducation);
router.delete("/education/:eduId", authenticate, deleteEducation);

// Resume
router.patch("/resume", authenticate, upload.single("resume"), updateResume);
router.delete("/resume", authenticate, deleteResume);

// AI Insights
router.get("/ai-insights", authenticate, getAiInsights);

// Skill Gap Analysis
router.post("/skill-gap-analysis", authenticate, skillGapAnalysis);

// Jobs Recommendations
router.post("/jobs/recommendations", authenticate, getJobRecommendations);

// LAST: public profile by id
router.get("/:id", getUserById);

export default router; 
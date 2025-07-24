import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.routes.js";
import careerChatRoute from "./routes/careerChat.routes.js";
import authRoute from "./routes/auth.routes.js";
import resumeAnalysisRoute from "./routes/resumeAnalysis.routes.js";
import interviewRoute from "./routes/interview.routes.js";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/career-chat", careerChatRoute);
app.use("/api/v1/ai", resumeAnalysisRoute);
app.use("/api/v1/interview", interviewRoute);

export { app }; 
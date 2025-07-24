import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    profileImage: { type: String, required: true },
    refreshToken: { type: String },
    bio: { type: String },
    location: { type: String },
    jobPreferences: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    experience: [
        {
            title: { type: String, required: true },
            company: { type: String, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date },
            description: { type: String },
        },
    ],
    education: [
        {
            institution: { type: String, required: true },
            degree: { type: String, required: true },
            fieldOfStudy: { type: String, required: true },
            startDate: { type: Date, required: true },
            endDate: { type: Date },
            description: { type: String },
        },
    ],
    resumeUrl: { type: String },
    aiInsights: {
        skillGaps: [{ type: String }],
        recommendedJobs: [{ type: String }],
        resumeAnalysis: { type: Schema.Types.Mixed },
        skillGapAnalysis: { type: Schema.Types.Mixed },
        careerPath: { type: String },
        lastAnalysisAt: { type: Date },
    },
});
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret)
        throw new Error("ACCESS_TOKEN_SECRET is not set");
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY ? String(process.env.ACCESS_TOKEN_EXPIRY) : "1d";
    return jwt.sign({
        _id: this._id,
        email: this.email,
        name: this.name,
        role: this.role,
    }, secret, { expiresIn });
};
userSchema.methods.generateRefreshToken = function () {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret)
        throw new Error("REFRESH_TOKEN_SECRET is not set");
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRY ? String(process.env.REFRESH_TOKEN_EXPIRY) : "10d";
    return jwt.sign({ _id: this._id }, secret, { expiresIn });
};
export const User = mongoose.model("User", userSchema);

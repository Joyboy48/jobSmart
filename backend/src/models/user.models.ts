import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  profileImage: string;
  refreshToken?: string;
  bio?: string;
  location?: string;
  jobPreferences?: string[]; 
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }>;
  resumeUrl?: string;
  aiInsights?: {
    skillGaps?: string[];
    recommendedJobs?: string[];
    resumeAnalysis?: {
      strengths?: string[];
      weaknesses?: string[];
      improvementTips?: string[];
    };
    careerPath?: string;
    lastAnalysisAt?: Date;
  };
  generateAccessToken: () => string;
  generateRefreshToken: () => string;
  isPasswordCorrect: (password: string) => Promise<boolean>;
}

const userSchema = new Schema<IUser>({
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
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not set");
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY ? String(process.env.ACCESS_TOKEN_EXPIRY) : "1d";
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    },
    secret,
    { expiresIn } as SignOptions
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET is not set");
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY ? String(process.env.REFRESH_TOKEN_EXPIRY) : "10d";
  return jwt.sign(
    { _id: this._id },
    secret,
    { expiresIn } as SignOptions
  );
};

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema); 
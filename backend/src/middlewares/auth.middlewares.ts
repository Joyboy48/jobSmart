import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user?: any; // You can replace 'any' with your IUser type if available
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "Authentication token missing");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload & { _id?: string };

    // Attach user to request (fetch from DB if needed)
    if (decoded && decoded._id) {
      req.user = await User.findById(decoded._id).select("-password");
      if (!req.user) {
        throw new apiError(401, "User not found");
      }
    } else {
      throw new apiError(401, "Invalid token");
    }

    next();
  } catch (err: any) {
    res.status(401).json({ error: err.message || "Unauthorized" });
  }
}; 
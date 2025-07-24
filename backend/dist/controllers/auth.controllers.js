import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
// Helper to generate tokens
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new apiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    }
    catch (error) {
        throw new apiError(500, "Something went wrong while generating tokens");
    }
};
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if ([name, email, password, role].some((field) => field?.trim() === "")) {
        throw new apiError(400, "All fields are required");
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new apiError(409, "User already exists");
    }
    // Type assertion to fix TS error for Multer fields upload
    const files = req.files;
    const profileImageLocalPath = files?.profileImage?.[0]?.path;
    if (!profileImageLocalPath) {
        throw new apiError(400, "profileImage is required");
    }
    const profileImage = await uploadOnCloudinary(profileImageLocalPath, "jobSmart");
    if (!profileImage) {
        throw new apiError(400, "profileImage is required");
    }
    const user = await User.create({
        name,
        profileImage: profileImage.url,
        email,
        password,
        role,
    });
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new apiError(500, "Something went wrong while creating the user");
    }
    res.status(200).json(new apiResponse(200, createdUser, "User created successfully"));
});
export const loginUser = asyncHandler(async (req, res) => {
    const { email, name, password } = req.body;
    if (!(name || email)) {
        throw new apiError(400, "name or email required");
    }
    const user = await User.findOne({ $or: [{ name }, { email }] });
    if (!user) {
        throw new apiError(404, "user not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiError(401, "password not valid");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(String(user._id));
    if (!accessToken || !refreshToken) {
        throw new apiError(500, "Token generation failed");
    }
    const loggedUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true,
    };
    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new apiResponse(200, {
        user: loggedUser,
        refreshToken,
        accessToken,
    }, "user loggedIn successfully"));
});
export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            refreshToken: undefined,
            new: true,
        },
    });
    const options = {
        httpOnly: true,
        secure: true,
    };
    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "Logged out successfully"));
});
export const refreshingAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new apiError(401, "unauthorized error");
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new apiError(401, "invalid refresh token");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Refresh token is expired or used");
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(String(user?._id));
        if (!accessToken || !newRefreshToken) {
            throw new apiError(401, "error while generating new token");
        }
        const options = {
            httpOnly: true,
            secure: true,
        };
        res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new apiResponse(200, { accessToken, newRefreshToken }, "token refreshed"));
    }
    catch (error) {
        throw new apiError(401, error?.message || "invalid refresh token");
    }
});
export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new apiError(404, "User not found");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new apiError(400, "invalid password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    res.status(200).json(new apiResponse(200, {}, "password updated successfully"));
});

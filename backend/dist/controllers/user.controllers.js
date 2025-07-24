import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
export const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(new apiResponse(200, req.user, "user fetched successfully"));
});
export const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    if (!(name || email)) {
        throw new apiError(400, "please provide the data");
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            name,
            email,
        },
        new: true,
    }).select("-password");
    res.status(200).json(new apiResponse(200, user, "account details update successfully"));
});
export const updateProfileImage = asyncHandler(async (req, res) => {
    const profileImageLocalPath = req.file?.path;
    if (!profileImageLocalPath) {
        throw new apiError(400, "please provide the image");
    }
    const profileImage = await uploadOnCloudinary(profileImageLocalPath, "jobSmart");
    if (!profileImage) {
        throw new apiError(400, "error while uploading image on cloudinary");
    }
    const oldLocalFilePath = req.user?.profileImage;
    if (!oldLocalFilePath) {
        throw new apiError(400, "old file not found");
    }
    const deleteOldImage = await deleteFromCloudinary(oldLocalFilePath, "jobSmart");
    if (!deleteOldImage) {
        throw new apiError(400, "error while deleting file from cloudinary");
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            profileImage: profileImage.url,
        },
        new: true,
    }).select("-password");
    res.status(200).json(new apiResponse(200, user, "image updated successfully"));
});
// Get public user profile by ID
export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).select("_id name profileImage bio location skills experience education resumeUrl aiInsights");
    if (!user)
        throw new apiError(404, "User not found");
    res.status(200).json(new apiResponse(200, user, "User profile fetched"));
});
// Update bio
export const updateBio = asyncHandler(async (req, res) => {
    const { bio } = req.body;
    if (typeof bio !== "string" || !bio.trim())
        throw new apiError(400, "Invalid bio");
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { bio } }, { new: true, select: "-password -refreshToken" });
    res.status(200).json(new apiResponse(200, user, "Bio updated"));
});
// Update location
export const updateLocation = asyncHandler(async (req, res) => {
    const { location } = req.body;
    if (typeof location !== "string" || !location.trim())
        throw new apiError(400, "Invalid location");
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { location } }, { new: true, select: "-password -refreshToken" });
    res.status(200).json(new apiResponse(200, user, "Location updated"));
});
// Update skills
export const updateSkills = asyncHandler(async (req, res) => {
    const { skills } = req.body;
    if (!Array.isArray(skills) || !skills.every((s) => typeof s === "string" && s.trim())) {
        throw new apiError(400, "Invalid skills array");
    }
    const userDoc = await User.findById(req.user._id);
    if (!userDoc)
        throw new apiError(404, "User not found");
    const existingSkills = Array.isArray(userDoc.skills) ? userDoc.skills : [];
    const mergedSkills = Array.from(new Set([...existingSkills, ...skills.map((s) => s.trim()).filter(Boolean)]));
    userDoc.skills = mergedSkills;
    await userDoc.save();
    res.status(200).json(new apiResponse(200, userDoc, "Skills updated"));
});
// Add experience
export const addExperience = asyncHandler(async (req, res) => {
    const { title, company, startDate, endDate, description } = req.body;
    if (!title || !company || !startDate)
        throw new apiError(400, "Missing required fields");
    const experience = { title, company, startDate, endDate, description };
    const user = await User.findByIdAndUpdate(req.user._id, { $push: { experience } }, { new: true, select: "-password -refreshToken" });
    res.status(200).json(new apiResponse(200, user, "Experience added"));
});
// Update experience
export const updateExperience = asyncHandler(async (req, res) => {
    const { expId } = req.params;
    const { title, company, startDate, endDate, description } = req.body;
    const user = await User.findOneAndUpdate({ _id: req.user._id, "experience._id": expId }, {
        $set: {
            "experience.$.title": title,
            "experience.$.company": company,
            "experience.$.startDate": startDate,
            "experience.$.endDate": endDate,
            "experience.$.description": description,
        },
    }, { new: true, select: "-password -refreshToken" });
    if (!user)
        throw new apiError(404, "Experience not found");
    res.status(200).json(new apiResponse(200, user, "Experience updated"));
});
// Delete experience
export const deleteExperience = asyncHandler(async (req, res) => {
    const { expId } = req.params;
    const user = await User.findByIdAndUpdate(req.user._id, { $pull: { experience: { _id: expId } } }, { new: true, select: "-password -refreshToken" });
    res.status(200).json(new apiResponse(200, user, "Experience deleted"));
});
// Add education
export const addEducation = asyncHandler(async (req, res) => {
    const { institution, degree, fieldOfStudy, startDate, endDate, description } = req.body;
    if (!institution || !degree || !fieldOfStudy || !startDate)
        throw new apiError(400, "Missing required fields");
    const education = { institution, degree, fieldOfStudy, startDate, endDate, description };
    const user = await User.findByIdAndUpdate(req.user._id, { $push: { education } }, { new: true, select: "-password -refreshToken" });
    res.status(200).json(new apiResponse(200, user, "Education added"));
});
// Update education
export const updateEducation = asyncHandler(async (req, res) => {
    const { eduId } = req.params;
    const { institution, degree, fieldOfStudy, startDate, endDate, description } = req.body;
    const user = await User.findOneAndUpdate({ _id: req.user._id, "education._id": eduId }, {
        $set: {
            "education.$.institution": institution,
            "education.$.degree": degree,
            "education.$.fieldOfStudy": fieldOfStudy,
            "education.$.startDate": startDate,
            "education.$.endDate": endDate,
            "education.$.description": description,
        },
    }, { new: true, select: "-password -refreshToken" });
    if (!user)
        throw new apiError(404, "Education not found");
    res.status(200).json(new apiResponse(200, user, "Education updated"));
});
// Delete education
export const deleteEducation = asyncHandler(async (req, res) => {
    const { eduId } = req.params;
    const user = await User.findByIdAndUpdate(req.user._id, { $pull: { education: { _id: eduId } } }, { new: true, select: "-password -refreshToken" });
    res.status(200).json(new apiResponse(200, user, "Education deleted"));
});
// Update resume (file upload)
export const updateResume = asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file)
        throw new apiError(400, "No resume file uploaded");
    // Accept only certain file types
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
        throw new apiError(400, "Invalid file type. Only PDF, DOC, DOCX, JPG, PNG allowed.");
    }
    // Upload to Cloudinary
    const uploaded = await uploadOnCloudinary(file.path, "jobSmart/resumes");
    if (!uploaded)
        throw new apiError(500, "Failed to upload resume");
    // Optionally delete old resume
    const userDoc = await User.findById(req.user._id);
    if (userDoc && userDoc.resumeUrl) {
        await deleteFromCloudinary(userDoc.resumeUrl, "jobSmart/resumes");
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { resumeUrl: uploaded.url } }, { new: true, select: "-password -refreshToken" });
    res.status(200).json(new apiResponse(200, user, "Resume updated"));
});
// Delete resume
export const deleteResume = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user || !user.resumeUrl)
        throw new apiError(404, "No resume to delete");
    // Delete from Cloudinary
    await deleteFromCloudinary(user.resumeUrl, "jobSmart/resumes");
    user.resumeUrl = undefined;
    await user.save();
    res.status(200).json(new apiResponse(200, {}, "Resume deleted successfully"));
});
// Get AI insights
export const getAiInsights = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("aiInsights");
    if (!user)
        throw new apiError(404, "User not found");
    res.status(200).json(new apiResponse(200, user.aiInsights, "AI insights fetched"));
});
// Update job preferences (target roles)
export const updateJobPreference = asyncHandler(async (req, res) => {
    const { jobPreferences } = req.body;
    if (!Array.isArray(jobPreferences) || !jobPreferences.every(j => typeof j === "string" && j.trim())) {
        throw new apiError(400, "Invalid job preferences. Must be an array of non-empty strings.");
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { jobPreferences } }, { new: true, select: "-password -refreshToken" });
    res.status(200).json(new apiResponse(200, user, "Job preferences updated"));
});

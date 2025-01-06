import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import {apiResponse} from "../utils/apiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const registerUser = asyncHandler(async(req,res)=>{

    //input
    const {name, email, password, role} = req.body
    console.log(email);
    

    //check  
    if([name, email, password, role].some((field)=>field?.trim()==="")){
        throw new apiError(400,"All fields are required")
    }

    //find existing user in db
    const existingUser = await User.findOne({email})

    //if found error
    if(existingUser){
        throw new apiError(409,"User already exists")
    }

    //input pfp
    const profileImageLocalPath = req.files?.profileImage[0]?.path

    //pfp check
    if(!profileImageLocalPath){
        throw new apiError(400,"profileImage is required")
    }

    //upload on cloudinary
    const profileImage = await uploadOnCloudinary(profileImageLocalPath)

    //check
    if(!profileImage){
        throw new apiError(400,"profileImage is required")
    }

    //create user
    const user = await User.create({
        name,
        profileImage:profileImage.url,
        email,
        password,
        role
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new apiError(500,"Something went wrong while creating the user")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,createdUser,"User created successfully")
    )




})

export {registerUser}
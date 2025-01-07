import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import {apiResponse} from "../utils/apiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

       //console.log("Generated Tokens:", {accessToken, refreshToken}); 

        return {accessToken, refreshToken}

    } catch (error) {
        //console.error("Error generating tokens:", error); 
        throw new apiError(500,"Something went wrong while generating tokens")
    }
}

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

const loginUser = asyncHandler(async(req,res)=>{

    //input
    const{email,name,password} = req.body

    //check 
    if(!(name || email)){
        throw new apiError(400,"name or email required")
    }

    //check in db
    const user = await User.findOne({
        $or:[{name},{email}]
    })

    //if not throw error
    if(!user){
        throw new apiError(404,"user not exist")
    }

    //password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    //if not throw error
    if(!isPasswordValid){
        throw new apiError(401,"password not valid")
    }

    //generate token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    if (!accessToken || !refreshToken) {
        throw new apiError(500, "Token generation failed");
      }

    //console.log("Tokens received:", {accessToken, refreshToken}); 

    //recieve details
    const loggedUser = await User.findById(user._id).select("-password -refreshToken")

    //send cookie
    const options = {
        httpOnly:true,
        secure:true 
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new apiResponse(
            200,
            {
                user:loggedUser,
                refreshToken,
                accessToken
            },
            "uesr loggedIn successfully"
        )
    )
})

export {registerUser,loginUser}
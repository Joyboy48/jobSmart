import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema(
    {
        name:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            },
        password:{
            type:String,
            required:[true,"Password is required"],
            minlength:6,
        },
        skills:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Skill",
            }
        ],
        bookmarks: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Job',
            },
          ],
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
          },
        profileImage:{
            type:String,
            required:true
        },
        refreshToken:{
            type:String
        }

    },{timestamps:true}
)

//middleware to hash the password beefore saving
userSchema.pre("save",async function(next){
    if(!this.isModified("password"))
    return next()
    this.password = await bcrypt.hash(this.password,10)
    next()
})

// Method to compare passwords during login
userSchema.method.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

// Method to generate Access Token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            name: this.name,
            role:this.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// Method to generate Refresh Token
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
    
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}






export const User = mongoose.model("User",userSchema)
import mongoose,{Schema} from "mongoose";

const jodSchema = new Schema (
    {
        title:{
            type:String,
            required:true,
            trim:true
        },
        company:{
            type:String,
            required:true,
            trim:true
        },
        description:{
            type:String,
            required:true,
        
        },
        location:{
            type:String,
            required:true,
            
        },
        salary:{
            type:Number,
            required:true,
        },
        jobType: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
            default: 'Full-time',
          },
        requiredSkills: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Skill', // References the Skill model
            },
          ],
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // References the User model (e.g., admin or employer)
            required: true,
          },
        isActive: {
            type: Boolean,
            default: true,
          },
        appliedUsers: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User', // Users who applied for the job
            },
          ],

},{timestamps:true})

export const Job = mongoose.model("Job",jodSchema)
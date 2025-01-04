import mongoose,{Schema} from "mongoose";

const skillSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    popularity: {
      type: Number,
      default: 0, 
    },
  },
  { timestamps: true }

);

export const Skill = mongoose.model("Skill",skillSchema)



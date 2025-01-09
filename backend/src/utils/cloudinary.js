import { v2 as cloudinary } from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url';
import fs from "fs"


 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,    
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath,path)=>{
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            folder:path,
            resource_type:"auto"
        })

        fs.unlinkSync(localFilePath)

        return response

    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}


const deleteFromCloudinary = async (cloudinaryUrl, path) => {
    try {
      if (!cloudinaryUrl) {
        throw new Error('Cloudinary URL is required');
      }
  
      ///get publicId
      const publicId = extractPublicId(cloudinaryUrl)
      console.log(publicId);
      
  //destroy
      const response = await cloudinary.uploader.destroy(publicId);
      
      if (response.result !== 'ok') {
        throw new Error(`Failed to delete: ${response.result}`);
      }
  
      console.log('Successfully deleted:', publicId);
      return response;
  
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error.message);
      throw error;
    }
  };

export {uploadOnCloudinary,deleteFromCloudinary}
import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";

import fs from "fs";
import ApiError from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/*
receive local file path as parameter, upload the file, if the successfully uploaded,
unlink from the local server
*/

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded successfully
    // console.log("File is uploaded on cloudinary..!", response.url);
    fs.unlink(localFilePath,()=>{
    })
    return response;
  } catch (error) {
    // delete the file from local server in case of failure attempt of uploading
    fs.unlink(localFilePath, (err) => {
      if (err) 
      console.error("Error on cloudinary",err);
    });
    return null;
  }
};

export default uploadOnCloudinary;

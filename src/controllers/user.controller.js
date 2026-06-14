import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { UserModel } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const registerUser = asyncHandler(async (req,res)=>{

    console.log(req.body);
    
    const {username,email,password,fullname} = req.body;

     if([username,email,password,fullname].some((field)=> !field?.trim())){
        throw new ApiError(400, "All fields are required")
    }

   const existedUser = UserModel.findOne({
        $or:[{username},{email}]
    })

    if(!existedUser){
        throw new ApiError(409, "User with email or username already exist..!")
    }
   
    const avatarLocalPath = req.files?.avatar[0]?.path; 
    //the path is from multer, where we upload files to our local server first
    const coverImagePath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
    const coverImageResponse = await uploadOnCloudinary(coverImagePath);

    if(!avatarResponse)throw new ApiError(400, "Avatar file is required");

    const user = await UserModel.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar:avatarResponse.url,
        coverImage: coverImageResponse?.url || ""

    })
    
    const userCreated = UserModel.findById(user._id).select("-password -refreshToken")
    if(!userCreated){
        throw new ApiError(500,"Something went wrong registering user");
    }

    return res.status(201).json(new ApiResponse(201, userCreated, "User registered successfully"))
    
})

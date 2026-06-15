import jwt from "jsonwebtoken"
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { UserModel } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, res, next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");

    if(!token){
        throw new ApiError(401, "Unauthorized Request")
    }
    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

    const user = await UserModel.findById(decodedToken?._id).select("-password -refreshToken");

    if(!user){
        throw new ApiError(401, "Invalid Access Token")

    }
    //adding an object named "user" to the req and saving the user info to the object
    req.user = user;
    next()
})
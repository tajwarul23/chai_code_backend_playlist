import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { UserModel } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";



export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullname } = req.body;

  if ([username, email, password, fullname].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await UserModel.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist..!");
  }

  const { avatar } = req.files;
  if (!avatar) throw new ApiError(400, "Avatar is required");

  //the path is from multer, where we upload files to our local server first
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImagePath = req.files?.coverImage?.[0]?.path;

  const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
  const coverImageResponse = coverImagePath
    ? await uploadOnCloudinary(coverImagePath)
    : null;

  if (!avatarResponse) throw new ApiError(400, "Failed to upload avatar file");

  const user = await UserModel.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatarResponse.url,
    coverImage: coverImageResponse?.url || "",
  });

  const userCreated = await UserModel.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, userCreated, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(401, "username or email is required");
  }

  if (!password) {
    throw new ApiError(401, "password is required");
  }

  const user = await UserModel.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await UserModel.findById(user._id).select(
    "-password -refreshToken",
  );

  //sending cookies
  const options = {
    httpOnly: true, //now the cookie is only modify-able from the server
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully..!",
      ),
    );
});

export const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    //save the refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token",
    );
  }
};

export const logoutUser = asyncHandler(async (req, res) => {
  const loggedOutUser = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }, 
    },
    { new: true },
  );

  const options = {
    httpOnly: true, //now the cookie is only modify-able from the server
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  const user = await UserModel.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(401, "Invalid Refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Invalid Refresh expired or used");
  }
  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "New Refresh token generated",
      ),
    );
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if ([oldPassword, newPassword].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await UserModel.findById(req.user._id).select("password");
  if (!user) {
    throw new ApiError(401, "No user found");
  }
  const isMatched = await user.isPasswordCorrect(oldPassword);
  if (!isMatched) {
    throw new ApiError(401, "Wrong Password");
  }
  const isSamePassword = await user.isPasswordCorrect(newPassword);
  if (isSamePassword) {
    throw new ApiError(400, "New password must be different");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Updated Successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const localFilePath = req.file?.path;
  if (!localFilePath) {
    throw new ApiError(401, "file is required");
  }
  //upload new avatar to cloudinary
  const uploadResponse = await uploadOnCloudinary(localFilePath);
  if (!uploadResponse?.url) {
    throw new ApiError(500, "Failed to upload avatar");
  }
  const newAvatar = uploadResponse.url;

  const user = await UserModel.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const oldAvatar = user.avatar;
  user.avatar = newAvatar;
  await user.save({ validateBeforeSave: false });

  //delete old avatar from cloudinary
  if (oldAvatar) {
    deleteFromCloudinary(oldAvatar).catch((err) => {
      console.log("Old avatar cleanup failed", err);
    });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, newAvatar, "Avatar updated"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname, email } },
    { new: true },
  ).select("fullname email");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User info updated successfully"));
});

export const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await UserModel.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        channelSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond:{
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      },
    },
    {
      $project:{
        fullname:1,
        username:1, 
        subscriberCount:1, 
        channelSubscribedToCount:1, 
        isSubscribed:1, 
        avatar:1, 
        coverImage:1, 
        email:1, 
        createdAt:1
      }
    }
  ]);
  console.log("Channel", channel);
  if(!channel?.length){
    throw new ApiError(404, "Channel does not exists")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
});


export  const getUserWatchHistory = asyncHandler(async(req,res)=>{
    const user = await UserModel.aggregate([
      //pipeline-1 to find the user
      {
        
        $match:{
          _id: new mongoose.Types.ObjectId(req.user._id)
        },
        
      },
      //pipeline-2 to get the user's watch history
      {
         $lookup:{
          from : "videos",
          localField:"watchHistory",
          foreignField:"_id",
          as:"watchHistory",
          //sub-pipeline-1 ==>> that will run on the each matched videos to get the owner info
          pipeline:[
            {
              //get the owner of the video
              $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                //sub-pipeline-2 ==>> that will run on the each matched user to project some fields
                pipeline:[
                  {
                    $project:{
                      fullname:1, username:1, avatar:1
                    }
                  }
                ]
              },
              
            },
            //another pipeline  to convert array[0] to object
            {
              
              $addFields:{
                owner:{
                  $first: "$owner"
                }
              }
            }
          ]

        },
      }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory), "Watch history fetched successfully")
  })


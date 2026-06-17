import express from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateProfile, updateAvatar, getUserWatchHistory, getChannelProfile } from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const authRouter = express.Router();

authRouter.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser,
);
authRouter.post(
  "/login",
  loginUser
  
);

//secured routes

authRouter.post("/logout", verifyJWT, logoutUser);
authRouter.post("/refresh-token", refreshAccessToken)
authRouter.post("/change-password", verifyJWT, changeCurrentPassword)
authRouter.get("/get-user", verifyJWT, getCurrentUser);
authRouter.patch("/update-avatar", verifyJWT, upload.single("avatar"), updateAvatar);
authRouter.patch("/update-profile", verifyJWT,  updateProfile);
/**---- Testing done till "/update-profile" ------- */

authRouter.get("/history", verifyJWT, getUserWatchHistory);
authRouter.get("/channel/:username", verifyJWT, getChannelProfile)

export default authRouter;

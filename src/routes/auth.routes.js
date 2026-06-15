import express from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser } from "../controllers/user.controller.js";
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
export default authRouter;

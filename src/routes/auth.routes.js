import express from "express";
import { registerUser } from "../controllers/user.controller.js";

const authRouter = express.Router();

authRouter.post("/register", registerUser)


export default authRouter
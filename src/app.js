import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

/**---MIDDLEWARES */

//to avoid the CORS error 
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//accepting json data [limit:optional]
app.use(express.json({limit:"20kb"}));

//accepting data through URL [limit:optional]
app.use(express.urlencoded({extended: true, limit:"20kb"}))

//for storing any file [photo,pdf] into our own server
app.use(express.static("public"))

//by using this we can access the user's browser's cookie from our server
app.use(cookieParser())

app.get("/", (req,res)=>{res.status(200).json({message:"Server is working"})})


// ROUTES IMPORT
import authRouter from "../src/routes/user.route.js"

// ROUTES DECLARATION
app.use("/api/v1/user", authRouter)

export default app;
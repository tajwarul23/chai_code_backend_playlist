import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/connectDB.js";
import app from "./app.js";

/** method-1 */
const port = process.env.PORT 
connectDB()
.then(()=>{
    app.listen(port|| 3000, ()=>{
        console.log(`App is listening to ${port}`);
        
    })
})
.catch((error)=>{
    console.error("MongoDB connection failed", error);
    
})
/*
method-2 IIFE
import express from "express";
const app = express();
;(async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       app.on("error",(error)=>{console.log("Error", error);
        throw error;
       });
       app.listen(process.env.PORT, ()=>{
        console.log(`App is listening on ${process.env.PORT}`);
        
       })
    } catch (error) {
        console.error("Error in DB connection", error);
        throw error;
        
    }
})()


*/
import mongoose  from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try {
      const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
      console.log("✅ MongoDB connected");
      
    } catch (error) {
        console.error("❌ Error in DB", error);
        throw error;
        
    }
}
export default connectDB;
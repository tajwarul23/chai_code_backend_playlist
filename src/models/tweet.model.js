import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema({
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    content:{
        type: String,
        required: true,
        minLength: 3,
        maxLength: 200
    },
    
},{timestamps:true});


tweetSchema.plugin(mongooseAggregatePaginate)
export const TweetModel = mongoose.model("Tweet", tweetSchema)
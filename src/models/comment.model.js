import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content:{
        type: String,
        required: true,
        minLength: 3,
        maxLength: 200
    },
    video:{
        type: Schema.Types.ObjectId,
        ref:"Video"
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref:"Tweet"
    },
    commentedBy:{
        type: Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})


commentSchema.plugin(mongooseAggregatePaginate)
export const CommentModel = mongoose.model("Comment", commentSchema)
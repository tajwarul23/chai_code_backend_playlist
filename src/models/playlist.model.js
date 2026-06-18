import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    description:{
        type: String
    },
    privacy:{
        type:String,
        enum:["Public", "Private", "Custom"],
        default:"Public"
        
    },
    video:[
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    createdBy:{
        type: Schema.Types.ObjectId,
            ref:"User"
    }
}, {timestamps:true})

playlistSchema.plugin(mongooseAggregatePaginate);
export const PlaylistModel = mongoose.model("Playlist",playlistSchema)
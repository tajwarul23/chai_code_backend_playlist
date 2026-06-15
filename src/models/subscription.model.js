import mongoose  from "mongoose";

const subscriptionSchema = new mongoose.Schema({

        subscriber :{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", //one who is subscribing
            required: true
        },

        channel:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // one to whom subscriber is subscribing
            required: true
        }
});


export const SubscriptionModel = mongoose.model("Subscription", subscriptionSchema);
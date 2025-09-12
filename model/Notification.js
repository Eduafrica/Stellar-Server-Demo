import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [ true, 'UserId is required to create notification' ]
    },
    read: {
        type: Boolean,
        default: false
    },
    notification: {
        type: String
    }
},
{ timestamps: true }
)

const NotificationModel = mongoose.model('notification', NotificationSchema)
export default NotificationModel
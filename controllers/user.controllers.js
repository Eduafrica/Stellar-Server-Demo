import { sendResponse } from "../middlewares/utils.js"
import NotificationModel from "../model/Notification.js"

//get notifications
export async function getNotificationsHistroy(req, res) {
    const { userId } = req.user
    const { page, limit, } = req.query

    try {
        const notification = await NotificationModel.find
    } catch (error) {
        console.log('UNABLE TO GET NOTIFICATION', error)
        sendResponse(res, 500, false, null, 'Unable to get user notification')
    }
}
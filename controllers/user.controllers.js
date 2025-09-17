import { sendResponse } from "../middlewares/utils.js";
import NotificationModel from "../model/Notification.js";

// get notifications (with pagination + history)
export async function getNotificationsHistroy(req, res) {
    const { userId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    try {
        const parsedPage = parseInt(page, 10) || 1;
        const parsedLimit = parseInt(limit, 10) || 10;
        const skip = (parsedPage - 1) * parsedLimit;

        // fetch notifications
        const notifications = await NotificationModel.find({ userId })
            .sort({ createdAt: -1 }) // latest first
            .skip(skip)
            .limit(parsedLimit);

        // count total for pagination
        const total = await NotificationModel.countDocuments({ userId });

        sendResponse(res, 200, true, {
            notifications,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                total,
                totalPages: Math.ceil(total / parsedLimit),
            },
        }, 'Notifications fetched successfully');
    } catch (error) {
        console.error('UNABLE TO GET NOTIFICATION', error);
        sendResponse(res, 500, false, null, 'Unable to get user notification');
    }
}

import IntructorModel from "../../model/Instructor.js";
import RefreshTokenModel from "../../model/RefreshToken.js";
import StudentModel from "../../model/Student.js";
import { sendResponse } from "../utils.js";
import jwt from "jsonwebtoken";

const SUSPENSION_TIME = 6 * 60 * 60 * 1000

export const AuthenticateUser = async (req, res, next) => {
    const accessToken = req.cookies.eduafricaauthtoken;
    const accountId = req.cookies.eduafricaauthid;
    console.log('AUTH USER >>', { accessToken, accountId, });

    try {
        let user;
        let decoded

        if (accessToken) {
            try {
                decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);
                const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: decoded.id });

                if (decoded.accountType === 'Student') {
                    user = await StudentModel.findOne({ userId: decoded.id });
                }

                if (decoded.accountType === 'Instructor') {
                    user = await IntructorModel.findOne({ userId: decoded.id });
                }

                if (!user) {
                    return sendResponse(res, 404, false, null, 'User not found');
                }
                if (!refreshTokenExist) {
                    return sendResponse(res, 401, false, null, 'Unauthenticated');
                }

                req.user = user;
            } catch (error) {
                if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
                    if (accountId) {

                        user = await StudentModel.findOne({ userId: accountId });

                        if (!user) {
                            user = await IntructorModel.findOne({ userId: accountId });
                        }
                        const refreshTokenExist = await RefreshTokenModel.findOne({ accountId });

                        if (user && refreshTokenExist) {
                            const newAccessToken = user.getAccessToken();
                            res.cookie('eduafricaauthtoken', newAccessToken, {
                                httpOnly: true,
                                sameSite: 'None',
                                secure: true,
                                maxAge: 15 * 60 * 1000, // 15 minutes
                            });
                            req.user = user;
                        } else {
                            return sendResponse(res, 401, false, null, 'Unauthenticated');
                        }
                    } else {
                        return sendResponse(res, 401, false, 'Unauthenticated');
                    }
                }
            }
        } else if (accountId) {
            
            user = await StudentModel.findOne({ userId: accountId });

            if (!user) {
                user = await IntructorModel.findOne({ userId: accountId });
            }

            const refreshTokenExist = await RefreshTokenModel.findOne({ accountId });

            if (user && refreshTokenExist) {
                const newAccessToken = user.getAccessToken();
                res.cookie('eduafricaauthtoken', newAccessToken, {
                    httpOnly: true,
                    sameSite: 'None',
                    secure: true,
                    maxAge: 15 * 60 * 1000, // 15 minutes
                });
                req.user = user;
            } else {
                return sendResponse(res, 401, false, 'Unauthenticated');
            }
        } else {
            return sendResponse(res, 401, false, 'Unauthenticated');
        }

        // ==========================
        // ✅ Verify Account Section
        // ==========================
        const { verified, isBlocked, accountSuspended, temporaryAccountBlockTime, isActive } = req.user;

        if (!verified) {
            return sendResponse(res, 401, false, 'Your account is not verified');
        }
        if (isBlocked) {
            return sendResponse(res, 401, false, 'Your account has been blocked. Contact admin for support');
        }
        if (accountSuspended) {
            const timeDiff = Date.now() - new Date(temporaryAccountBlockTime).getTime();
            const remainingTime = Math.ceil((SUSPENSION_TIME - timeDiff) / (60 * 1000)); // in minutes
            return sendResponse(res, 403, false, `Account temporarily blocked. Try again in ${remainingTime} minutes.`);
        }

        // If everything is fine
        return next();

    } catch (error) {
        console.error('Authentication/Verification error:', error);
        return sendResponse(res, 500, false, 'Server error during authentication');
    }
};

// allow account types (case-insensitive)
export const AllowedUserType = (allowedUserType) => {
  // allowedUserType = ['Student', 'Instructor']
  return (req, res, next) => {
    if (!req.user?.accountType) {
      return sendResponse(res, 403, false, 'Not allowed', 'User account type not found');
    }

    const userType = req.user.accountType.toLowerCase();
    const allowedTypes = allowedUserType.map(type => type.toLowerCase());

    // Check if the user's type is in the allowedUserType array
    if (!allowedTypes.includes(userType)) {
      return sendResponse(res, 403, false, 'Forbidden', 'You do not have permission to access this resource');
    }

    next();
  };
};

import { sendAccountActivationEmail, sendNewLoginEmail, sendWelcomeEmail } from "../middlewares/mailer/mailService/mailTemplate.js"
import { generateUniqueCode, maskEmail, sendResponse, validatePassword } from "../middlewares/utils.js"
import RefreshTokenModel from "../model/RefreshToken.js"
import moment from "moment";
import { createKeypair, fundWithFriendbot } from "../stellar/stellar.mjs";
import KeyModel from "../model/Key.js";
import IntructorModel from "../model/Instructor.js";
import crypto from 'crypto'
import NotificationModel from "../model/Notification.js";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const MAX_LOGIN_ATTEMPTS = 4
const SUSPENSION_TIME = 6 * 60 * 60 * 1000


//register
export async function register(req, res) {
    const { name, email, password, } = req.body
    if(!name) return sendResponse(res, 400, false, null, 'Instructor name is required')
    if(!email) return sendResponse(res, 400, false, null, 'Instructor email address is required')
    if(!password) return sendResponse(res, 400, false, null, 'Instructor password is required')
    const verifyPassword = await validatePassword(password)
    if(!verifyPassword.success) return sendResponse(res, 400, false, null, verifyPassword.message)

    try {
        const isEmailExist = await IntructorModel.findOne({ email })
        if(isEmailExist) return sendResponse(res, 400, false, null, 'Instructor with this email already exist')
        
        const newId = await generateUniqueCode(9)
        const userId = `EDU${newId}IN`

        //create keys
        const stellerKey = createKeypair()
        //sendResponse(res, 200, true, stellerKey, 'Success')
        //return

        const newInstructor = await IntructorModel.create({
            userId,
            name,
            email,
            password,
            verified: true,
        })

        //create user key
        await KeyModel.create({
            userId,
            stellarPublic: stellerKey?.publicKey,
            stellarSecretEncrypted: stellerKey?.secret
        })

        //fund user account
        await fundWithFriendbot(stellerKey?.publicKey)


        //send welcome email
        sendWelcomeEmail({
            email,
            name
        })
        sendAccountActivationEmail({
            email,
            name
        })

        await NotificationModel.create({
            userId,
            notification: `Hello ${name} You new instructor account has been created`
        })
        await NotificationModel.create({
            userId,
            notification: `Hello ${name} a new wallet address has been created and added for you wallet`
        })

        //set auth cookie
        const accessToken = newInstructor.getAccessToken()
        const refreshToken = newInstructor.getRefreshToken()
        //refresh token
        const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: newInstructor.userId })
        if(refreshTokenExist){
            refreshTokenExist.refreshToken = refreshToken
            await refreshTokenExist.save()
        } else {
            await RefreshTokenModel.create({
                accountId: newInstructor?.userId,
                refreshToken,
                userType: newInstructor?.userType,
                accountType: newInstructor?.accountType
            })
        }
        ///set and send cookies
        res.cookie('eduafricaauthtoken', accessToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
        });
        res.cookie('eduafricaauthid', newInstructor?.userId, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        //send user data
        const { password: userPassword, verified, isBlocked, accountSuspended, noOfLoginAttempts, temporaryAccountBlockTime, resetPasswordToken, completedOnboarding, _id, ...userData } = newInstructor._doc;

        const data = {
            ...userData,
            publicKey: stellerKey?.publicKey
        }

        sendResponse(res, 201, true, data, 'User created successfull')
    } catch (error) {
        console.log('UNABLE TO CREATE NEW INSTRUCTOR', error)
        sendResponse(res, 500, false, null, 'Unable to create new instructor account')
    }
}

//login
export async function login(req, res) {
    const { email, password }  = req.body
    const { country, region, city, deviceType, deviceInfo } = req.location || {}
    if(!email) return sendResponse(res, 400, false, null, 'Email address is required')
    if(!emailRegex.test(email)) return sendResponse(res, 400, null, 'Invalid email address')
    if(!password) return sendResponse(res, 400, false, null, 'Password is required')
        
    try {
        const getUser = await IntructorModel.findOne({ email })
        if(!getUser) return sendResponse(res, 404, false, null, 'Invalid Credentials')
        
        const getKey = await KeyModel.findOne({ userId: getUser?.userId })

        if(getUser?.isBlocked){
            sendResponse(res, 403, false, null, 'Account has been blocked')
            return
        }

        //check if user is still in the six hours of suspension
        if (getUser.accountSuspended && getUser.temporaryAccountBlockTime) {
            const timeDiff = Date.now() - new Date(getUser.temporaryAccountBlockTime).getTime();
            if (timeDiff < SUSPENSION_TIME) {
                const remainingTime = Math.ceil((SUSPENSION_TIME - timeDiff) / (60 * 1000)); // in minutes
                return sendResponse(res, 403, false, null, `Account temporarily blocked. Try again in ${remainingTime} minutes.`);
            } else {
                // Reset suspension if time has passed
                getUser.accountSuspended = false;
                getUser.temporaryAccountBlockTime = null;
                getUser.noOfLoginAttempts = 0;
                await getUser.save();
            }
        } else {
            // Reset suspension if time has passed
            getUser.accountSuspended = false;
            getUser.temporaryAccountBlockTime = null;
            getUser.noOfLoginAttempts = 0;
            await getUser.save();
        }

        //validate password
        const validatePassword = await getUser.matchPassword(password)
        //console.log('validatePassword', validatePassword)
        if(!validatePassword){
            getUser.noOfLoginAttempts += 1
            await getUser.save()
            if(getUser.noOfLoginAttempts >= MAX_LOGIN_ATTEMPTS){
                getUser.accountSuspended = true
                getUser.temporaryAccountBlockTime = new Date(); // Set suspension start time
                await getUser.save();
                return sendResponse(res, 403, false, null, `Too many failed attempts. Your account is blocked for 6 hours.`);
            } else {
                return sendResponse(res, 403, false, null, 'Wrong email or password', `${MAX_LOGIN_ATTEMPTS - getUser.noOfLoginAttempts} login attempts left`)
            }

        } else {
            getUser.accountSuspended = false
            getUser.noOfLoginAttempts = 0
            getUser.temporaryAccountBlockTime = null
            getUser.lastLogin = Date.now()
            await getUser.save();
        }

        //save user latest info
        getUser.lastLoginInfo.unshift({
            device: deviceInfo,
            location: `${city} ${region} ${country}`,
            deviceType: deviceType
        });

        // Limit history to the last 5 logins
        getUser.lastLoginInfo = getUser.lastLoginInfo.slice(0, 5);
        await getUser.save();

        //send login email notification
        const loginTime = moment(getUser.lastLogin, 'x'); // Convert timestamp to Moment.js date
        
        sendNewLoginEmail({
            email: getUser?.email,
            name: `${getUser?.name}`,
            time: loginTime.format('YYYY-MM-DD HH:mm:ss'),
            device: getUser.lastLoginInfo[0]
        });

        //set auth cookie
        const accessToken = getUser.getAccessToken()
        const refreshToken = getUser.getRefreshToken()
        //refresh token
        const refreshTokenExist = await RefreshTokenModel.findOne({ accountId: getUser.userId })
        if(refreshTokenExist){
            refreshTokenExist.refreshToken = refreshToken
            await refreshTokenExist.save()
        } else {
            await RefreshTokenModel.create({
                accountId: getUser?.userId,
                refreshToken,
                userType: getUser?.userType,
                accountType: getUser?.accountType
            })
        }
        ///set and send cookies
        res.cookie('eduafricaauthtoken', accessToken, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
        });
        res.cookie('eduafricaauthid', getUser?.userId, {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        //send user data
        const { password: userPassword, verified, isBlocked, accountSuspended, noOfLoginAttempts, temporaryAccountBlockTime, resetPasswordToken, completedOnboarding, _id, ...userData } = getUser._doc;

        const data = {
            ...userData,
            publicKey: getKey?.stellarPublic
        }
        sendResponse(res, 201, true, data, 'Login Successful')
    } catch (error) {
        console.log('UNABLE TO LOGIN USER', error)
        sendResponse(res, 500, false, null, 'Unable to process login request')
    }
}

//forgot password
export async function forgotPassword(req, res) {
    const { email } = req.body
    if(!email) return sendResponse(res, 400, false, null, 'Email address is required')
    if(!emailRegex.test(email)) return sendResponse(res, 400, false, null, 'Invalid email address')

    try {
        const getUser = await IntructorModel.findOne({ email })
        if(!getUser) return sendResponse(res, 404, false, null, 'Invalid email address')

        //generate  forgot password token
        const resetToken = getUser.getPasswordToken()
        await getUser.save()

        sendForgotPasswordEmail({
            email: getUser?.email,
            name: getUser?.name,
            buttonLink: `${ENV.CLIENT_URL}/reset-password/${resetToken}`,
        })

        //mask email address
        const hideEmail = maskEmail(email)
        sendResponse(res, 200, true, hideEmail, `Reset password link sent to ${hideEmail} Link is valid for 15 Min`)
    } catch (error) {
        console.log('UNABLE TO PROCESS FORGOT PASSWORD', error)
        sendResponse(res, 500, false, null, 'Unable to process forgot password request')
    }
}

//reset password
export async function resetPassword(req, res) {
    const { password } = req.body
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex')

    if(!password) return sendResponse(res, 400, false, null, 'password id required')
    const verifyPassword = await validatePassword(password)
    if(!verifyPassword.success) return sendResponse(res, 400, false, null, verifyPassword.message)


    try {
        const getUser = await IntructorModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now()}
        })

        if(!getUser) return sendResponse(res, 400, false, null, 'Invalid reset token')

        const passwordMatch = await getUser.matchPassword(password)
        if(passwordMatch) return sendResponse(res, 400, false, null, 'Old password must not match new password')
        
        getUser.password = password
        getUser.resetPasswordToken = null
        getUser.resetPasswordExpire = null
        await getUser.save()


        sendResponse(res, 201, true, null, 'Passowrd reset success')
    } catch (error) {
        console.log('UNABLE TO RESET USER PASSWORD', error)
        sendResponse(res, 500, false, null, 'Unable to reset user password')
    }

}

//verify token
export async function verifyToken(req, res) {
    const accessToken = req.cookies.eduafricaauthtoken;
    const accountId = req.cookies.eduafricaauthid;

    try {
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);

                if (decoded.accountType !== 'Instructor') {
                    return sendResponse(res, 403, false, null, 'Unauthorized access');
                }

                const user = await IntructorModel.findOne({ userId: decoded.id });
                if (!user) return sendResponse(res, 404, false, null, 'User not found');
                if (!user.refreshToken) return sendResponse(res, 401, false, null, 'Unauthenticated');

                // Remove sensitive data before sending the response
                const { password, noOfLoginAttempts, temporaryAccountBlockTime, verified, accountSuspended, isBlocked, resetPasswordToken, resetPasswordExpire, subscriptionPriceId, subscriptionId, _id, ...userData } = user._doc;
                return sendResponse(res, 200, true, userData, accessToken);
            } catch (error) {
                if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
                    return handleTokenRefresh(res, accountId);
                }
                return sendResponse(res, 401, false, null, 'Invalid token');
            }
        } else if (accountId) {
            return handleTokenRefresh(res, accountId);
        }

        return sendResponse(res, 401, false, null, 'Unauthenticated');
    } catch (error) {
        console.error('UNABLE TO VERIFY TOKEN', error);
        return sendResponse(res, 500, false, null, 'Unable to verify token');
    }
}

async function handleTokenRefresh(res, accountId) {
    if (!accountId) return sendResponse(res, 401, false, null, 'Unauthenticated');

    const user = await IntructorModel.findOne({ userId: accountId });
    if (!user) return sendResponse(res, 404, false, null, 'User not found');

    const refreshTokenExist = await RefreshTokenModel.findOne({ accountId });
    if (!refreshTokenExist) return sendResponse(res, 401, false, null, 'Invalid refresh token');

    const newAccessToken = user.getAccessToken();
    res.cookie('eduafricaauthtoken', newAccessToken, {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    const { password, noOfLoginAttempts, temporaryAccountBlockTime, verified, accountSuspended, isBlocked, resetPasswordToken, resetPasswordExpire, completedOnboarding, _id, ...userData } = user._doc;
    return sendResponse(res, 200, true, userData, newAccessToken);
}

//signout
export async function signout(req, res) {
    const { userId } = req.user || {}
    try {
        const getRefreshTokenToken = await RefreshTokenModel.findOne({ accountId: userId })

        if(getRefreshTokenToken){
            const deleteToken = await RefreshTokenModel.findOneAndDelete({ accountId: userId })
        }
        res.clearCookie(`eduafricaauthtoken`)
        res.clearCookie(`eduafricaauthid`)

        return sendResponse(res, 200, true, null, 'Signout success')
    } catch (error) {
        console.log('UNABLE TO SIGNOUT ACCOUNT', error)
        return sendResponse(res, 500, false, null, 'Unable to process signout')
    }
}

//update account

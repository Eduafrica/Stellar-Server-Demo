import { sendResponse } from "../middlewares/utils.js"
import CourseInfoModel from "../model/CourseInfo.js"
import KeyModel from "../model/Key.js"
import NotificationModel from "../model/Notification.js"
import OrderModel from "../model/Order.js"
import StudentModel from "../model/Student.js"
import TransactionModel from "../model/Transaction.js"
import { fundWithFriendbot, getBalance, getPayments, sendXLM, sendXLMWithBridge } from "../stellar/stellar.mjs"

//fund wallet
export async function fundWallet(req, res) {
    const { userId } = req.user

    try {
        const getAccount = await KeyModel.findOne({ userId })
        if(!getAccount) return sendResponse(res, 404, false, null, 'Account not found')
        const fundAccountWallet = await fundWithFriendbot(getAccount?.stellarPublic)

        const newTransaction = await TransactionModel.create({
            userId,
            id: fundAccountWallet?.id,
            hash: fundAccountWallet?.hash,
            success: fundAccountWallet?.successful,
            ledger: fundAccountWallet?.ledger,
            date: fundAccountWallet?.created_at,
            amount: Number(fundAccountWallet?.max_fee / 100)?.toFixed(2),
            feeCharged: Number(fundAccountWallet?.fee_charged)?.toFixed(2)
        })

        await  NotificationModel.create({
            userId,
            notification: `You have funded your account with ${newTransaction?.amount} xlm`
        })

        sendResponse(res, 200, true, newTransaction, 'Successfully funded wallet')
    } catch (error) {
        console.log('UNABLE TO FUND WALLET', error)
        sendResponse(res, 500, false, null, error?.detail || 'Unable to fund wallet')
    }
}

//get wallet balance
export async function getXlmBalance(req, res) {
    const { userId } = req.user

    try {
        const getAccount = await KeyModel.findOne({ userId })
        if(!getAccount) return sendResponse(res, 404, false, null, 'Account not found')
        const getWalletBalance = await getBalance(getAccount?.stellarPublic)

        sendResponse(res, 200, true, getWalletBalance, 'Xlm balance')
    } catch (error) {
        console.log('UNABLE TO GET XLM BALANCE', error)
        sendResponse(res, 500, false, null, 'Unable to get xlm balance')
    }
}

//get payment histroy
export async function getPaymentHistroy(req, res) {
    const { userId } = req.user
    const { limit, cursor } = req.query

    try {
        const getAccount = await KeyModel.findOne({ userId })
        if(!getAccount) return sendResponse(res, 404, false, null, 'Account not found')
        const getWalletBalance = await getPayments(getAccount?.stellarPublic, { limit, cursor })

        sendResponse(res, 200, true, getWalletBalance, 'Xlm payment histroy')
    } catch (error) {
        console.log('UNABLE TO GET XLM PAYMENT HISTROY', error)
        sendResponse(res, 500, false, null, 'Unable to get xlm payment histroy')
    }
}

/**
 * 

//make payment
export async function makePayment(req, res) {
    const { userId } = req.user
    const { destinationPublic, courseId } = req.body
    if(!destinationPublic) return sendResponse(res, 400, false, null, 'Proivde destination address key')
    if(!courseId) return sendResponse(res, 400, false, null, 'Course Id is required')
    
    try {
        const getCourse = await CourseInfoModel.findOne({ courseId })
        if(!getCourse) return sendResponse(res, 404, false, null, 'Course not found')
        
        //get student secret ket
        const getStudentKey = await KeyModel.findOne({ userId })

        //get instructor public ket
        const getInstructorKey = await KeyModel.findOne({ userId: getCourse?.userId })

        //make payment
        const price = getCourse?.price

        const stellarPayment = await sendXLM({ 
            sourceSecret: getStudentKey?.stellarSecretEncrypted, 
            destinationPublic: getInstructorKey?.stellarPublic,
            amount: Number(price)
        })

        //notify student
        //notify instructor
        //create order - save status to
    } catch (error) {
        console.log('UNABLE TO MAKE PAYMENT OF COURSE', error)
        sendResponse(res, 500, false, null, 'Unable to process payment for course')
    }
}
 */

export async function makePayment(req, res) {
    const { userId } = req.user
    const { courseId } = req.body
    if(!courseId) return sendResponse(res, 400, false, null, 'Course Id is required')
    
    try {
        const getUser = await StudentModel.findOne({ userId })

        const getCourse = await CourseInfoModel.findOne({ courseId })
        if(!getCourse) return sendResponse(res, 404, false, null, 'Course not found')
        
        // Get student secret key
        const getStudentKey = await KeyModel.findOne({ userId })
        // Get instructor public key
        const getInstructorKey = await KeyModel.findOne({ userId: getCourse?.userId })

        if(!getStudentKey?.stellarSecretEncrypted) {
            return sendResponse(res, 400, false, null, 'Student wallet not found')
        }
        if(!getInstructorKey?.stellarPublic) {
            return sendResponse(res, 400, false, null, 'Instructor wallet not found')
        }
        
        const price = getCourse?.price
        
        // Make payment with company fee deduction
        const stellarPayment = await sendXLMWithBridge({ 
            sourceSecret: getStudentKey?.stellarSecretEncrypted, 
            destinationPublic: getInstructorKey?.stellarPublic,
            amount: Number(price),
            companyWallet: process.env.COMPANY_WALLET_ADDRESS, // Add this to your env
            feePercentage: 25 // 25% company fee - make this configurable
        })
        
        if(stellarPayment.success) {
            // Create order record
            const orderData = {
                userId,
                courseId,
                paymentMethod: "stellar",
                instructorId: getCourse.userId,
                totalAmount: price,
                companyFee: stellarPayment?.companyFee,
                instructorAmount: stellarPayment?.instructorAmount,
                transactionHash: stellarPayment?.transactionHash,
                companyTransactionHash: stellarPayment?.companyTransactionHash,
                status: 'completed',
                paymentDate: new Date()
            }
            
            // Save order (uncomment when you have OrderModel)
            const newOrder = await OrderModel.create(orderData)

            
            // Notify student and instructor
            // await notifyStudent(userId, orderData)
            await NotificationModel.create({
                userId,
                notification: `Your purchase of course was successful. Course: ${getCourse?.title} - ${getCourse?.price}. Payment method: "Stellar"`
            })

            // await notifyInstructor(getCourse.userId, orderData)
            await NotificationModel.create({
                userId: getCourse.userId,
                notification: `Successful purchase of your course. Course: ${getCourse?.title}. Price ${stellarPayment?.instructorAmount}`
            })

            getUser.courses.push(courseId)
            await getUser.save()
            
            return sendResponse(res, 200, true, {
                //...stellarPayment,
                order: orderData
            }, 'Payment successful')
        } else {
            return sendResponse(res, 400, false, null, stellarPayment.error || 'Payment failed')
        }
        
    } catch (error) {
        console.log('UNABLE TO MAKE PAYMENT OF COURSE', error)
        sendResponse(res, 500, false, null, 'Unable to process payment for course')
    }
}

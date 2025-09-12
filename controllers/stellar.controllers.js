import { sendResponse } from "../middlewares/utils.js"
import KeyModel from "../model/Key.js"
import NotificationModel from "../model/Notification.js"
import TransactionModel from "../model/Transaction.js"
import { fundWithFriendbot, getBalance, getPayments } from "../stellar/stellar.mjs"

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

//make payment
export async function makePayment(req, res) {
    const { userId } = req.user
    const { destinationPublic, courseId } = req.body
    if(!destinationPublic) return sendResponse(res, 400, false, null, 'Proivde destination address key')
    if(!courseId) return sendResponse(res, 400, false, null, 'Course Id is required')
    
    try {
        
    } catch (error) {
        console.log('UNABLE TO MAKE PAYMENT OF COURSE', error)
        sendResponse(res, 500, false, null, 'Unable to process payment for course')
    }
}
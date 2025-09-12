import express from 'express'
import * as controllers from '../../controllers/stellar.controllers.js'
import { getLocation } from '../../middlewares/location.js'
import { AuthenticateUser } from '../../middlewares/auth/user-auth.js'

const router = express.Router()

//POST
router.post('/fund', AuthenticateUser, controllers.fundWallet)
router.post('/pay', AuthenticateUser, controllers.makePayment)

//GET
router.get('/balance', AuthenticateUser, controllers.getXlmBalance)
router.get('/paymentHistroy', AuthenticateUser, controllers.getPaymentHistroy)

export default router
import express from 'express'
import * as controllers from '../../controllers/user.controllers.js'
import { getLocation } from '../../middlewares/location.js'
import { AllowedUserType, AuthenticateUser } from '../../middlewares/auth/user-auth.js'

const router = express.Router()

//POST

//GET
router.get('/notification', AuthenticateUser, controllers.getNotificationsHistroy)

export default router
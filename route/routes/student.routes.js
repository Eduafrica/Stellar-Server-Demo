import express from 'express'
import * as controllers from '../../controllers/student.controlers.js'
import { getLocation } from '../../middlewares/location.js'
import { AuthenticateUser } from '../../middlewares/auth/user-auth.js'

const router = express.Router()

//POST
router.post('/register', controllers.register)
router.post('/login', getLocation, controllers.login)
router.post('/forgotPassword', controllers.forgotPassword)
router.post('/resetPassword', controllers.resetPassword)
router.post('/signout', AuthenticateUser, controllers.signout)

//GET
router.get('/verifyToken', controllers.verifyToken)

export default router
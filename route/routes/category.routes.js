import express from 'express'
import * as controllers from '../../controllers/course.controllers.js'
import { getLocation } from '../../middlewares/location.js'
import { AllowedUserType, AuthenticateUser } from '../../middlewares/auth/user-auth.js'

const router = express.Router()

//category
router.post('/', controllers.newCategory)
router.put('/:id', controllers.updateCategory)
router.delete('/:id', controllers.deleteCategory)


//GET
router.get('/', controllers.getCategory)

export default router
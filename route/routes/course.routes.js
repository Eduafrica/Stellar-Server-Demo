import express from 'express'
import * as controllers from '../../controllers/course.controllers.js'
import { getLocation } from '../../middlewares/location.js'
import { AllowedUserType, AuthenticateUser } from '../../middlewares/auth/user-auth.js'

const router = express.Router()

//POST
//instructor
router.post('/', AuthenticateUser, AllowedUserType(['Instructor']), controllers.newCourse)
router.patch('/', AuthenticateUser, AllowedUserType(['Instructor']), controllers.editCourse)
router.delete('/', AuthenticateUser, AllowedUserType(['Instructor']), controllers.deletCourse)

//student/public

//category
router.put('/category/:id', controllers.updateCategory)
router.delete('/category/:id', controllers.deleteCategory)

//GET
//instructor

//student/public
router.get('/instructor/course', AuthenticateUser, AllowedUserType(['Instructor']), controllers.getInstructorCourse)
router.get('/', controllers.getCourses)
router.get('/:courseId', controllers.getCourse)
router.get('/student/course', AuthenticateUser, controllers.getStudentCourses)

//category
router.get('/category', controllers.getCategory)

export default router
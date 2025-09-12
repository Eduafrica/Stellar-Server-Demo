import mongoose from "mongoose";

const CourseInfoSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [ true, 'User id is required' ]
    },
    courseId: {
        type: String,
        required: [ true, 'Course Id is required' ],
        unique: [ true, 'Course Id is required' ]
    },
    title: {
        type: String,
        required: [ true, 'Course Title is required' ]
    },
    image: {
        type: String,
    },
    about: {
        type: String
    },
    description: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    totalStudent: {
        type: Number,
        default: 0
    },
    student: {
        type: Array,
        default: []
    },
    price: {
        type: Number
    }
},
{ timestamps: true }
)

const CourseInfoModel = mongoose.model('course', CourseInfoSchema)
export default CourseInfoModel
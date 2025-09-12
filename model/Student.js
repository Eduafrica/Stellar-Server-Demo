import mongoose from "mongoose";
import bcryptjs from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'
import crypto from 'crypto'

const StudentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [ true, 'Student Id must be unique' ],
        unique: [ true, 'Student Id must be unique' ]
    },
    name: {
        type: String,
        required: [ true, 'Student Name is required' ]
    },
    email: {
        type: String,
        required: [ true, 'Student Email address is required' ],
        unique: [ true, 'Student Email must be unique' ]
    },
    password: {
        type: String,
        required: [ true, 'Student Password is required' ]
    },
    accountType: {
        type: String,
        default: 'Student'
    },
    courses: {
        type: Array,
        default: []
    },
    lastLoginInfo: [{
        device: {
            type: String,
        },
        location: {
            type: String
        },
        deviceType: {
            type: String
        }
    }],
    lastLogin: {
        type: Date
    },

    verified: {
        type: Boolean,
        default: false,
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    accountSuspended: {
        type: Boolean,
        default: false
    },
    noOfLoginAttempts: {
        type: Number,
        default: 0,
    },
    temporaryAccountBlockTime: {
        type: Date,
    },
    
    /**PASSWORD REQ TOKENS */
    resetPasswordToken: String,
    resetPasswordExpire: Date,
},
{ timestamps: true }
)

StudentSchema.pre('save', async function(next) {
    if(!this.isModified('password')){
        return next();
    }

    try {
        const salt = await bcryptjs.genSalt(10)
        this.password = await bcryptjs.hash(this.password, salt)
        next()
    } catch (error) {
        console.log('UNABLE TO HASH PASSWORD', error)
        next(error)
    }
})

StudentSchema.methods.matchPassword = async function(password) {
    return await bcryptjs.compare(password, this.password)
}

StudentSchema.methods.getAccessToken = function(){
    return jsonwebtoken.sign({ id: this.userId, accountType: this?.accountType }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE})
}

StudentSchema.methods.getRefreshToken = function(){
    return jsonwebtoken.sign({ id: this._id, email: this.email, name: this.name }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE})
}

StudentSchema.methods.getPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpire = Date.now() + 15 * ( 60 * 1000 )

    return resetToken
}

const StudentModel = mongoose.model('student', StudentSchema)
export default StudentModel
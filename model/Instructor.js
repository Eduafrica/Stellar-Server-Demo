import mongoose from "mongoose";
import bcryptjs from 'bcryptjs'
import jsonwebtoken from 'jsonwebtoken'
import crypto from 'crypto'

const InstructorSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [ true, 'Instructor Id must be unique' ],
        unique: [ true, 'Instructor Id must be unique' ]
    },
    name: {
        type: String,
        required: [ true, 'Instructor Name is required' ]
    },
    email: {
        type: String,
        required: [ true, 'Instructor Email address is required' ],
        unique: [ true, 'Instructor Email must be unique' ]
    },
    password: {
        type: String,
        required: [ true, 'Instructor Password is required' ]
    },
    accountType: {
        type: String,
        default: 'Instructor'
    },
    cashWallet: {
        type: Number,
        default: 0,
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

InstructorSchema.pre('save', async function(next) {
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

InstructorSchema.methods.matchPassword = async function(password) {
    return await bcryptjs.compare(password, this.password)
}

InstructorSchema.methods.getAccessToken = function(){
    return jsonwebtoken.sign({ id: this.userId, accountType: this?.accountType }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE})
}

InstructorSchema.methods.getRefreshToken = function(){
    return jsonwebtoken.sign({ id: this._id, email: this.email, name: this.name }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE})
}

InstructorSchema.methods.getPasswordToken = function(){
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.resetPasswordExpire = Date.now() + 15 * ( 60 * 1000 )

    return resetToken
}

const IntructorModel = mongoose.model('instructor', InstructorSchema)
export default IntructorModel
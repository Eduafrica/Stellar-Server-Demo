import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [ true, 'User id is required']
    },
    courseId: {
        type: String
    },
    paymentMethod: {
        type: String
    },
    instructorId: {
        type: String
    },
    totalAmount: {
        type: String
    },
    companyFee: {
        type: Number
    },
    instructorAmount: {
        type: Number
    },
    transactionHash: {
        type: String
    },
    companyTransactionHash: {
        type: String
    },
    status: {
        type: String
    },
    paymentDate: {
        type: Date
    }
},
{ timestamps: true }
)

const OrderModel = mongoose.model('order', OrderSchema)
export default OrderModel
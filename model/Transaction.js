import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    id: {
        type: String
    },
    hash: {
        type: String
    },
    success: {
        type: Boolean,
        default: false
    },
    ledger: {
        type: String,
    },
    date: {
        type: Date
    },
    amount: {
        type: Number
    },
    feeCharged: {
        type: Number
    }
},
{ timestamps: true }
)

const TransactionModel = mongoose.model('transaction', TransactionSchema)
export default TransactionModel
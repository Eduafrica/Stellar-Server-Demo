import mongoose from "mongoose";

const KeySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [ true, 'User id is required' ],
        unique: [ true, 'User Id must be unique' ]
    },
    stellarPublic: {
        type: String
    },
    stellarSecretEncrypted: {
        type: String, // encrypted secret
    },
    streamCursor: {
        type: String, // last processed payment cursor for this user
    }
},
{ timestamps: true}
)

const KeyModel = mongoose.model('key', KeySchema)
export default KeyModel
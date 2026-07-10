const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema(
    {
        socketId: { type: String, required: true },
        username: { type: String, required: true, maxlength: 20 },
        ipAddress: { type: String, required: true }
    },
    { _id: false }
) // No separate _id for subdocuments unless needed


module.exports = mongoose.model('User', UserSchema)
const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema(
	{
		roomId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Room',
			required: true,
			index: true
		},
		senderIP: { type: String, required: true },
		username: { type: String, required: true },
		type: {
			type: String,
			enum: ['text', 'file', 'system'],
			default: 'text',
			required: true
		},
		content: { type: String, required: true },
        fileInfo: { 
            name: String,
            type: String,
            url: String, // URL to the uploaded file
            size: Number
        },
		deletedAt: { type: Date, default: null }
	},
	{ timestamps: { createdAt: 'timestamp' } }
)

module.exports = mongoose.model('Message', MessageSchema)

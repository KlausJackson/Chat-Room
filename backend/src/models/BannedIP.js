const mongoose = require('mongoose')


const BannedIPSchema = new mongoose.Schema(
	{
		ipAddress: { type: String, required: true },
		reason: { type: String },
		bannedByAdminIP: { type: String } // IP of admin who banned
	},
	{ timestamps: { createdAt: 'bannedAt' } }
)

module.exports = mongoose.model('BannedIP', BannedIPSchema)

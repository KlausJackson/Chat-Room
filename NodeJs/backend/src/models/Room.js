const mongoose = require('mongoose')
const UserSchema = require('./User')
const bannedIPSchema = require('./BannedIP')

const RoomSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 50 },
		socketRoomId: { type: String, required: true, unique: true }, // Usually this.id.toString()
		password: { type: String, trim: true },
		ownerIP: { type: String, required: true },
		admins: [{
			ip: { type: String, required: true },
			rights: {
				kick: { type: Boolean, default: false },
				ban: { type: Boolean, default: false },
				lock: { type: Boolean, default: false },
				changePassword: { type: Boolean, default: false },
				setBadWords: { type: Boolean, default: false }
			}
		}],
		rightPresets: [{
			name: { type: String, required: true },
			rights: {
				kick: { type: Boolean, default: false },
				ban: { type: Boolean, default: false },
				lock: { type: Boolean, default: false },
				changePassword: { type: Boolean, default: false },
				setBadWords: { type: Boolean, default: false }
			}
		}],
		locked: { type: Boolean, default: false },
		maxUsers: { type: Number, default: 50, min: 1, max: 200 },
		filteredWords: [{ type: String, trim: true, lowercase: true }],
		defaultFilter: { type: Boolean, default: true },
		activeUsers: { type: [UserSchema.schema], required: true },
		bannedIPs: { type: [bannedIPSchema.schema], default: [] },
		hiddenStatusIPs: [{ type: String }],
		deletedAt: { type: Date, default: null }
	},
	{ timestamps: true }
)

module.exports = mongoose.model('Room', RoomSchema)

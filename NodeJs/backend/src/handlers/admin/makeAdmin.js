const { emitRoomDetails } = require('../../utils/socketHelpers')
const createVerifyAdmin = require('../../utils/verifyAdmin')

function makeAdmin(io, socket) {
	const verifyAdmin = createVerifyAdmin(socket)
	socket.on('adminMakeAdmin', async ({ targetUserSocketId }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin()
		if (!authResult) return callback({ error: 'Authorization failed' })
		const { room, isOwner } = authResult

		if (!isOwner) return callback({ error: 'Only the room owner can promote others to admin.' })
		if (room.admins.length >= 10) return callback({ error: 'Maximum of 10 admins reached.' })

		const targetUser = room.activeUsers.find((u) => u.socketId === targetUserSocketId)
		if (!targetUser) return callback({ error: 'Target user not found.' })
		if (room.admins.some((a) => a.ip === targetUser.ipAddress)) {
			return callback({ success: true, message: `${targetUser.username} is already an admin.` })
		}

		room.admins.push({ ip: targetUser.ipAddress, rights: { kick: true, ban: true, lock: true, changePassword: true, setBadWords: true } })
		await room.save()
		callback({ success: true, message: `${targetUser.username} is now an admin.` })
		emitRoomDetails(io, room._id)
	})
}

module.exports = makeAdmin

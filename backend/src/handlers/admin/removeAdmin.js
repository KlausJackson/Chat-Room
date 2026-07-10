const { emitRoomDetails } = require('../../utils/socketHelpers')
const createVerifyAdmin = require('../../utils/verifyAdmin')

function removeAdmin(io, socket) {
	const verifyAdmin = createVerifyAdmin(socket)
	socket.on('removeAdmin', async ({ targetSocketId }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin()
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room, isOwner } = authResult

		const targetUser = room.activeUsers.find((u) => u.socketId === targetSocketId)
		if (!targetUser) return callback({ error: 'Target user not found.' })
		if (!room.admins.some((a) => a.ip === targetUser.ipAddress)) {
			return callback({ success: true, message: `${targetUser.username} is not an admin.` })
		}
		if (!isOwner) return callback({ error: 'Only the room owner can remove admins.' })

		room.admins = room.admins.filter((a) => a.ip !== targetUser.ipAddress)
		await room.save()
		callback({ success: true, message: `${targetUser.username} is no longer an admin.` })
		emitRoomDetails(io, room._id)
	})
}

module.exports = removeAdmin

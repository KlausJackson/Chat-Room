const { emitRoomDetails, emitMessageToRoom } = require('../../utils/socketHelpers')
const createVerifyAdmin = require('../../utils/verifyAdmin')

function kickHandler(io, socket) {
	const verifyAdmin = createVerifyAdmin(socket)
	socket.on('kickUser', async ({ socketIdToKick, reason }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin('kick')
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room, isOwner } = authResult

		const targetUser = room.activeUsers.find((u) => u.socketId === socketIdToKick)
		if (!targetUser) return callback({ error: 'User not found in this room.' })

		if (!isOwner) {
			if (targetUser.ipAddress === room.ownerIP) return callback({ error: 'Cannot kick the room owner.' })
			if (room.admins.some((a) => a.ip === targetUser.ipAddress)) return callback({ error: 'Only the room owner can kick admins.' })
		}

		const kickedSocket = io.sockets.sockets.get(socketIdToKick)
		if (kickedSocket) {
			kickedSocket.emit('kicked', { roomName: room.name, reason: reason || 'No reason provided.' })
			kickedSocket.leave(room.socketRoomId)
			delete kickedSocket.currentRoomId
			delete kickedSocket.currentRoomSocketId
		}

		room.activeUsers = room.activeUsers.filter((u) => u.socketId !== socketIdToKick)
		await room.save()

		emitMessageToRoom(io, 'SYSTEM', 'System', 'system', room._id, `${targetUser.username} has been kicked.`)
		emitRoomDetails(io, room._id)
		callback({ success: true, message: `${targetUser.username} kicked.` })
	})
}

module.exports = kickHandler

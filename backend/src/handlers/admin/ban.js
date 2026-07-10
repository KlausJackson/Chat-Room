const { emitRoomDetails, emitMessageToRoom } = require('../../utils/socketHelpers')
const createVerifyAdmin = require('../../utils/verifyAdmin')


function banHandler(io, socket) {
	const verifyAdmin = createVerifyAdmin(socket)
	socket.on('adminBanIP', async ({ ipToBan, reason }, callback) => {
		if (typeof callback !== 'function') callback = () => {} // default callback if not provided

		// verify admin right
		const authResult = await verifyAdmin('ban')
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room, isOwner } = authResult

		// check ip to ban
		if (!ipToBan) return callback({ error: 'IP address to ban is required.' })
		if (room.ownerIP === ipToBan) return callback({ error: 'Cannot ban the room owner.' })
		if (room.admins.some((a) => a.ip === ipToBan) && !isOwner) return callback({ error: 'Only the room owner can ban other admins.' })

		try {
			const existingBan = room.bannedIPs.find((b) => b.ipAddress === ipToBan)
			if (existingBan) return callback({ success: true, message: `IP ${ipToBan} is already banned.` })

			// Kick the user if they're active
			const activeUser = room.activeUsers.find((u) => u.ipAddress === ipToBan)
			if (activeUser) {
				const targetSocket = io.sockets.sockets.get(activeUser.socketId)
				if (targetSocket) {
					targetSocket.emit('kicked', { roomName: room.name, reason: reason || 'You have been banned.' })
					targetSocket.leave(room.socketRoomId)
					delete targetSocket.currentRoomId
					delete targetSocket.currentRoomSocketId
				}
				room.activeUsers = room.activeUsers.filter((u) => u.ipAddress !== ipToBan)
			}

			room.bannedIPs.push({ ipAddress: ipToBan, reason: reason || 'No reason provided.', bannedByAdminIP: socket.currentUserIP })
			await room.save()

			callback({ success: true, message: `IP ${ipToBan} has been banned.` })
			emitMessageToRoom(io, 'SYSTEM', 'System', 'system', room._id, `IP ${ipToBan} has been banned.`)
			emitRoomDetails(io, room._id)
		} catch (error) {
			console.error('Error banning IP:', error)
			callback({ error: 'Server error while banning IP.' })
		}
	})
}

module.exports = banHandler

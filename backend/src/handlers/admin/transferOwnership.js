const { emitRoomDetails } = require('../../utils/socketHelpers')
const createVerifyAdmin = require('../../utils/verifyAdmin')

function transferOwnershipHandler(io, socket) {
	const verifyAdmin = createVerifyAdmin(socket)
	socket.on('transferOwnership', async ({ targetUserSocketId }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin()
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room, isOwner } = authResult

		if (!isOwner) return callback({ error: 'Only the room owner can transfer ownership.' })

		const targetUser = room.activeUsers.find((u) => u.socketId === targetUserSocketId)
		if (!targetUser) return callback({ error: 'Target user not found.' })

		// Check if the target user is already the owner in case the owner is trying to transfer ownership to themselves (same IP address, different socketId - happens when the owner refreshes the page)
		if (targetUser.ipAddress === room.ownerIP) return callback({ error: 'They are already the owner.' })

		room.ownerIP = targetUser.ipAddress
		room.admins = room.admins.filter((a) => a.ip !== targetUser.ipAddress)
		await room.save()

		callback({ success: true, message: `Ownership transferred to ${targetUser.username}.` })
		emitRoomDetails(io, room._id)
	})
}

module.exports = transferOwnershipHandler

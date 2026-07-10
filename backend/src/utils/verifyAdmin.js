const Room = require('../models/Room')
const { checkUser } = require('./socketHelpers')

/**
 * Returns a verifyAdmin function bound to the given socket.
 * Import this in handlers instead of receiving verifyAdmin as a parameter.
 */
function createVerifyAdmin(socket) {
	return async function verifyAdmin(requiredRight = null) {
		let checkErr = null
		checkUser(socket, (error) => { if (error) checkErr = error })
		if (checkErr) { socket.emit('adminError', checkErr); return null }

		const room = await Room.findById(socket.currentRoomId)
		if (!room || room.deletedAt) { socket.emit('adminError', { message: 'Room not found.' }); return null }

		const isOwner = room.ownerIP === socket.currentUserIP
		const adminEntry = room.admins.find((a) => a.ip === socket.currentUserIP)

		if (!isOwner && !adminEntry) {
			socket.emit('adminError', { message: 'Authorization failed. You are not an admin.' })
			return null
		}

		if (requiredRight && !isOwner) {
			if (!adminEntry.rights || !adminEntry.rights[requiredRight]) {
				socket.emit('adminError', { message: `Authorization failed. Missing right: ${requiredRight}` })
				return null
			}
		}

		return { room, isOwner, adminEntry }
	}
}

module.exports = createVerifyAdmin

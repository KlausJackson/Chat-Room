const Message = require('../../models/Message')
const Room = require('../../models/Room')
const { emitRoomDetails, sendSystemMessage } = require('../../utils/socketHelpers')

async function performLeave(io, socket) {
	const { currentRoomId, currentUsername, currentRoomSocketId } = socket
	if (!currentRoomId) return { error: 'You are not in a room.' }

	try {
		const room = await Room.findOne({ _id: currentRoomId, deletedAt: null })
		if (room) {
			socket.leave(currentRoomSocketId)
			room.activeUsers = room.activeUsers.filter((u) => u.socketId !== socket.id)

			if (room.activeUsers.length === 0) {
				room.deletedAt = new Date()
				await room.save()
				await Message.updateMany(
					{ roomId: room._id, deletedAt: null },
					{ deletedAt: new Date() }
				)
			} else {
				await room.save()
				if (currentUsername) {
					await sendSystemMessage(io, room._id, `${currentUsername} has left.`)
				}
				emitRoomDetails(io, room._id)
			}
		}

		delete socket.currentRoomId
		delete socket.currentRoomSocketId
		delete socket.currentUsername
		return { success: true }
	} catch (error) {
		console.error('Error leaving room:', error)
		return { error: 'Server error while leaving room.' }
	}
}

function leaveRoom(io, socket) {
	socket.on('leaveRoom', async (callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const result = await performLeave(io, socket)
		callback(result)
	})
}

module.exports = leaveRoom
module.exports.performLeave = performLeave

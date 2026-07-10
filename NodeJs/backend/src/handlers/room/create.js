const bcrypt = require('bcrypt')
const Room = require('../../models/Room')
const { emitRoomDetails } = require('../../utils/socketHelpers')

function createRoom(socket, io, userIP) {
	socket.on('createRoom', async ({ roomName, username, roomPassword }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		if (!roomName || !username) {
			return callback({ error: 'Room name and username are required.' })
		}
		if (roomName.trim().length > 50) {
			return callback({ error: 'Room name cannot exceed 50 characters.' })
		}
		if (username.trim().length > 20) {
			return callback({ error: 'Username cannot exceed 20 characters.' })
		}

		try {
			const newRoom = new Room({
				name: roomName.trim(),
				password: roomPassword ? await bcrypt.hash(roomPassword.trim(), 10) : null,
				ownerIP: userIP,
				admins: [],
				rightPresets: [],
				activeUsers: [{ socketId: socket.id, username: username.trim(), ipAddress: userIP }]
			})

			newRoom.socketRoomId = newRoom._id.toString()
			await newRoom.save()

			socket.join(newRoom.socketRoomId)
			socket.currentRoomId = newRoom._id
			socket.currentRoomSocketId = newRoom.socketRoomId
			socket.currentUsername = username.trim()

			callback({ success: true, room: { id: newRoom._id.toString(), name: newRoom.name } })
			emitRoomDetails(io, newRoom._id)
		} catch (error) {
			console.error('Error creating room:', error)
			callback({ error: 'Server error while creating room.' })
		}
	})
}

module.exports = createRoom

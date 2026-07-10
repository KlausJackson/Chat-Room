const bcrypt = require('bcrypt')
const Room = require('../../models/Room')
const Message = require('../../models/Message')
const { emitRoomDetails, sendSystemMessage } = require('../../utils/socketHelpers')

function joinRoom(socket, io, userIP) {
	socket.on('joinRoom', async ({ username, roomId, roomPassword }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		if (!roomId || !username) {
			return callback({ error: 'Room ID and username are required.' })
		}
		if (username.trim().length > 20) {
			return callback({ error: 'Username cannot exceed 20 characters.' })
		}

		try {
			const room = await Room.findById(roomId)
			if (!room || room.deletedAt) return callback({ error: 'Room not found.' })

			const isBanned = room.bannedIPs.find((b) => b.ipAddress === userIP)
			if (isBanned) return callback({ error: 'You are banned from this room. Reason: ' + isBanned.reason })

			const isAdmin = room.ownerIP === userIP || room.admins.some((a) => a.ip === userIP)
			if (room.locked && !isAdmin) return callback({ error: 'This room is locked.' })

			if (room.password) {
				if (!(await bcrypt.compare(roomPassword || '', room.password))) {
					return callback({ error: 'Incorrect room password.' })
				}
			}

			const existingIdx = room.activeUsers.findIndex((u) => u.ipAddress === userIP)
			if (existingIdx > -1) {
				// Reconnect/reload: update socketId for the existing user
				room.activeUsers[existingIdx].socketId = socket.id
				room.activeUsers[existingIdx].username = username.trim()
			} else {
				if (room.activeUsers.some((u) => u.username === username.trim())) {
					return callback({ error: 'Username already taken in this room.' })
				}
				if (room.activeUsers.length >= room.maxUsers) {
					return callback({ error: 'Room is full.' })
				}
				room.activeUsers.push({ socketId: socket.id, username: username.trim(), ipAddress: userIP })
			}

			await room.save()

			socket.join(room.socketRoomId)
			socket.currentRoomId = room._id
			socket.currentRoomSocketId = room.socketRoomId
			socket.currentUserIP = userIP
			socket.currentUsername = username.trim()

			callback({ success: true, room: { id: room._id.toString(), name: room.name } })

			const messages = await Message.find({ roomId: room._id, deletedAt: null })
				.sort({ timestamp: -1 })
				.limit(50)
				.lean()
			socket.emit('loadMessages', messages.reverse())

			await sendSystemMessage(io, room._id, `${username.trim()} has joined.`)
			emitRoomDetails(io, room._id)
		} catch (error) {
			console.error('Error joining room:', error)
			callback({ error: 'Server error while joining room.' })
		}
	})
}

module.exports = joinRoom

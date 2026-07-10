const Room = require('../models/Room')
const BannedIP = require('../models/BannedIP')
const Message = require('../models/Message')

function checkUser(socket, callback) {
	if (
		!socket.currentRoomId &&
		!socket.currentUsername &&
		!socket.currentUserIP &&
		!socket.currentRoomSocketId
	) {
		return callback({
			error: 'You must be in a room to send messages.'
		})
	}
}

async function emitMessageToRoom(io, sender, username, type, roomId, message) {
	const newMessage = new Message({
		senderIP: sender,
		username: username,
		content: message,
		type: type,
		roomId: roomId
	})
	await newMessage.save()

	io.to(roomId).emit('newMessage', newMessage)
}

function getUserIP(socket) {
	const xForwardedFor = socket.handshake.headers['x-forwarded-for']
	if (xForwardedFor) {
		const parts = xForwardedFor.split(',')
		return parts[0].trim()
	}
	if (socket.handshake.address) {
		// For Socket.IO v3+
		return socket.handshake.address.includes('::ffff:')
			? socket.handshake.address.split(':').pop()
			: socket.handshake.address
	}
	// Fallback for older versions or different proxy setups
	const conn = socket.request.connection
	if (conn && conn.remoteAddress) {
		return conn.remoteAddress.includes('::ffff:')
			? conn.remoteAddress.split(':').pop()
			: conn.remoteAddress
	}
	return 'unknown'
}

async function emitRoomDetails(io, roomId, customMessage) {
	try {
		const room = await Room.findOne({ _id: roomId, deletedAt: null }).lean()
		if (!room) return

		const hiddenIPs = room.hiddenStatusIPs || []

		const usersForEmit = room.activeUsers.map(function (u) {
			const adminEntry = room.admins.find(a => a.ip === u.ipAddress)
			const isAdmin = !!adminEntry
			const isOwner = u.ipAddress === room.ownerIP
			const isHidden = hiddenIPs.includes(u.ipAddress)
			return {
				socketId: u.socketId,
				username: u.username,
				isAdmin: isHidden ? false : (isAdmin || isOwner),
				isOwner: isHidden ? false : isOwner,
				rights: isHidden ? {} : (adminEntry ? adminEntry.rights : (isOwner ? { kick: true, ban: true, lock: true, changePassword: true, setBadWords: true } : {}))
			}
		})

		const roomDataForUsers = {
			id: room._id.toString(),
			name: room.name,
			locked: room.locked,
			users: usersForEmit,
			maxUsers: room.maxUsers,
			useDefaultFilter: room.defaultFilter
		}

		// Emit basic details to everyone
		io.to(room.socketRoomId).emit('roomDetailsUpdated', roomDataForUsers)

		// If there's a specific system message to send along with update
		if (
			customMessage &&
			customMessage.text &&
			customMessage.type === 'system'
		) {
			io.to(room.socketRoomId).emit('newMessage', {
				username: 'System',
				content: customMessage.text,
				type: 'system',
				timestamp: new Date()
			})
		}

		// For each user, send personal status + admin details if applicable
		const globallyBannedIPs = await BannedIP.find({})
			.select('ipAddress reason')
			.lean()

		room.activeUsers.forEach(function (user) {
			const targetSocket = io.sockets.sockets.get(user.socketId)
			if (targetSocket) {
				const adminEntry = room.admins.find(a => a.ip === user.ipAddress)
				const isOwner = user.ipAddress === room.ownerIP
				const isAdmin = !!adminEntry || isOwner
				const isHidden = hiddenIPs.includes(user.ipAddress)

				// Send personal status so each user knows their own true role
				targetSocket.emit('personalStatus', {
					isAdmin: isAdmin,
					isOwner: isOwner,
					isHidden: isHidden,
					myRights: isOwner ? { kick: true, ban: true, lock: true, changePassword: true, setBadWords: true } : (adminEntry?.rights || {})
				})

				if (isAdmin) {
					targetSocket.emit('adminRoomDetailsUpdated', {
						...roomDataForUsers,
						admins: room.admins,
						rightPresets: room.rightPresets,
						myRights: isOwner ? { kick: true, ban: true, lock: true, changePassword: true, setBadWords: true } : (adminEntry?.rights || {}),
						customFilteredWords: room.filteredWords,
						bannedIPs: room.bannedIPs,
						hiddenStatusIPs: hiddenIPs,
						globallyBannedIPs: globallyBannedIPs
					})
				}
			}
		})
	} catch (error) {
		console.error('Error emitting room details:', error)
	}
}


async function emitRoomDetailsToAdmins(io, roomId) {
	return emitRoomDetails(io, roomId)
}


async function sendSystemMessage(io, roomId, messageText) {
	try {
		const room = await Room.findOne({ _id: roomId, deletedAt: null }).select('socketRoomId').lean()
		if (!room) return

		const systemMessage = new Message({
			roomId: room._id,
			senderIP: 'SYSTEM',
			username: 'System',
			type: 'system',
			content: messageText
		})
		await systemMessage.save()
		io.to(room.socketRoomId).emit('newMessage', systemMessage.toObject())
	} catch (error) {
		console.error('Error sending system message:', error)
	}
}

module.exports = {
	checkUser,
	getUserIP,
	emitRoomDetails,
	sendSystemMessage,
	emitMessageToRoom,
	emitRoomDetailsToAdmins
}

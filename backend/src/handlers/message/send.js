const Filter = require('bad-words')
const Room = require('../../models/Room')
const Message = require('../../models/Message')

function sendHandler(socket, io) {
	socket.on('sendMessage', async ({ messageText }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const { currentRoomId, currentUsername, currentUserIP, currentRoomSocketId } = socket

		if (!currentRoomId || !currentUsername || !currentUserIP || !currentRoomSocketId) {
			return callback({ error: 'You must be in a room to send messages.' })
		}
		if (!messageText || messageText.trim() === '') {
			return callback({ error: 'Message cannot be empty.' })
		}

		try {
			const room = await Room.findOne({ _id: currentRoomId, deletedAt: null }).select('filteredWords defaultFilter').lean()
			if (!room) return callback({ error: 'Room not found.' })

			const processedMessage = messageText.trim()
			if (room.defaultFilter && new Filter().isProfane(processedMessage)) {
				return callback({ error: 'Your message contains inappropriate language.' })
			}
			if (room.filteredWords && room.filteredWords.length > 0) {
				const customFilter = new Filter({ emptyList: true })
				customFilter.addWords(...room.filteredWords)
				if (customFilter.isProfane(processedMessage)) {
					return callback({ error: 'Your message contains inappropriate language (room filter).' })
				}
			}

			const newMessage = new Message({
				roomId: currentRoomId,
				senderIP: currentUserIP,
				username: currentUsername,
				type: 'text',
				content: processedMessage
			})
			await newMessage.save()

			io.to(currentRoomSocketId).emit('newMessage', newMessage)
			callback({ success: true })
		} catch (error) {
			console.error('Error sending message:', error)
			callback({ error: 'Server error while sending message.' })
		}
	})
}

module.exports = sendHandler

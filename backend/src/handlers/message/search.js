const Message = require('../../models/Message')

function searchHandler(socket) {
	socket.on('searchMessages', async ({ query }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const { currentRoomId } = socket

		if (!currentRoomId) return callback({ error: 'You must be in a room to search.' })
		if (!query || query.trim() === '') return callback({ error: 'Search query cannot be empty.' })

		try {
			const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			const regex = new RegExp(escaped, 'i')

			const messages = await Message.find({
				roomId: currentRoomId,
				deletedAt: null,
				$or: [
					{ content: regex },
					{ username: regex },
					{ 'fileInfo.name': regex }
				]
			})
				.sort({ timestamp: 1 })
				.limit(100)
				.lean()

			callback({ success: true, results: messages })
		} catch (error) {
			console.error('Error searching messages:', error)
			callback({ error: 'Server error while searching.' })
		}
	})
}

module.exports = searchHandler

const { emitRoomDetails } = require('../../utils/socketHelpers')
const createVerifyAdmin = require('../../utils/verifyAdmin')

function setFilterHandler(io, socket) {
	const verifyAdmin = createVerifyAdmin(socket)
	socket.on('adminSetFilteredWords', async ({ filteredWords }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin('setBadWords')
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room } = authResult

		if (!Array.isArray(filteredWords)) return callback({ error: 'Filtered words must be an array.' })
		room.filteredWords = filteredWords.map((w) => w.trim().toLowerCase())
		await room.save()
		emitRoomDetails(io, room._id)
		callback({ success: true, message: 'Filtered words updated.', filteredWords: room.filteredWords })
	})
}

module.exports = setFilterHandler

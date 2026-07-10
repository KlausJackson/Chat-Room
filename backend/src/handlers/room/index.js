const create = require('./create')
const join = require('./join')
const leave = require('./leave')
const { performLeave } = require('./leave')

function roomHandler(io, socket) {
	create(socket, io, socket.currentUserIP)
	join(socket, io, socket.currentUserIP)
	leave(io, socket)

	socket.on('disconnect', async () => {
		await performLeave(io, socket)
	})
}

module.exports = roomHandler

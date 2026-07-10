const roomHandler = require('./room')
const adminHandler = require('./admin')
const messageHandler = require('./message')

/**
 * Registers all socket event handlers for a connected socket.
 */
function registerHandlers(io, socket) {
	roomHandler(io, socket)
	adminHandler(socket, io)
	messageHandler(socket, io)
}

module.exports = registerHandlers

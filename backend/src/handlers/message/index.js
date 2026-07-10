const sendHandler = require('./send')
const searchHandler = require('./search')

function messageHandler(socket, io) {
	sendHandler(socket, io)
	searchHandler(socket)
}

module.exports = messageHandler

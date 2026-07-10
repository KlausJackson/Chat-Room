const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const cors = require('cors')
const fileUpload = require('express-fileupload')

const config = require('./config')
const { getUserIP } = require('./utils/socketHelpers')
const { uploadFile, getFileStream, getFileStat } = require('./utils/storage')
const connectDB = require('./database')
const registerHandlers = require('./handlers')
const Room = require('./models/Room')
const Message = require('./models/Message')

// ---- Database ----
connectDB()

// ---- App Setup ----
const app = express()
const server = http.createServer(app)

// ---- Middleware ----
app.use(cors(config.cors))
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))
app.use(fileUpload({ limits: { fileSize: config.maxFileSize }, abortOnLimit: true }))

// ---- File Download (proxy from MinIO) ----
app.get('/uploads/:roomId/:fileName', async (req, res) => {
	const objectKey = `${req.params.roomId}/${req.params.fileName}`
	try {
		const stat = await getFileStat(objectKey)
		res.set('Content-Type', stat.metaData?.['content-type'] || 'application/octet-stream')
		res.set('Content-Length', stat.size)
		res.set('Content-Disposition', `inline; filename="${req.params.fileName}"`)
		const stream = await getFileStream(objectKey)
		stream.pipe(res)
	} catch (err) {
		if (err.code === 'NotFound' || err.code === 'NoSuchKey') {
			return res.status(404).json({ error: 'File not found.' })
		}
		console.error('Error streaming file:', err)
		res.status(500).json({ error: 'Error retrieving file.' })
	}
})

// ---- Socket.IO ----
const io = new Server(server, { cors: config.cors, maxHttpBufferSize: config.maxFileSize })

io.on('connection', (socket) => {
	socket.currentUserIP = getUserIP(socket)
	registerHandlers(io, socket)
})

// ---- File Upload Endpoint ----
app.post('/upload', async (req, res) => {
	if (!req.files || !req.files.file) {
		return res.status(400).json({ error: 'No file uploaded.' })
	}

	const { roomId, socketId } = req.body
	if (!roomId || !socketId) {
		return res.status(400).json({ error: 'roomId and socketId are required.' })
	}

	const targetSocket = io.sockets.sockets.get(socketId)
	if (!targetSocket || !targetSocket.currentRoomId || targetSocket.currentRoomId.toString() !== roomId) {
		return res.status(403).json({ error: 'Invalid socket or not in the specified room.' })
	}

	try {
		const room = await Room.findOne({ _id: roomId, deletedAt: null })
		if (!room) return res.status(404).json({ error: 'Room not found.' })

		const file = req.files.file
		const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
		const objectKey = `${roomId}/${safeName}`

		await uploadFile(objectKey, file.data, file.mimetype)

		const fileUrl = `/uploads/${roomId}/${safeName}`

		const newMessage = new Message({
			roomId: room._id,
			senderIP: targetSocket.currentUserIP,
			username: targetSocket.currentUsername,
			type: 'file',
			content: file.name,
			fileInfo: {
				name: file.name,
				type: file.mimetype,
				size: file.size,
				url: fileUrl
			}
		})
		await newMessage.save()

		io.to(room.socketRoomId).emit('newMessage', newMessage)
		res.json({ success: true, message: newMessage })
	} catch (error) {
		console.error('Error uploading file:', error)
		res.status(500).json({ error: 'Server error while uploading file.' })
	}
})

// ---- Health Check ----
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// ---- 404 ----
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

// ---- Start ----
server.listen(config.port, '0.0.0.0', () => {
	console.log(`Server running on port ${config.port} (LAN accessible)`)
})

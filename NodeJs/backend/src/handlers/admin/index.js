const kickHandler = require('./kick')
const banHandler = require('./ban')
const makeAdmin = require('./makeAdmin')
const removeAdmin = require('./removeAdmin')
const setFilterHandler = require('./setFilter')
const changePasswordHandler = require('./changePassword')
const setRightsHandler = require('./setRights')
const transferOwnershipHandler = require('./transferOwnership')
const createVerifyAdmin = require('../../utils/verifyAdmin')
const { emitMessageToRoom, emitRoomDetails } = require('../../utils/socketHelpers')

function adminHandler(socket, io) {
	const verifyAdmin = createVerifyAdmin(socket)

	kickHandler(io, socket)
	banHandler(io, socket)
	makeAdmin(io, socket)
	removeAdmin(io, socket)
	setFilterHandler(io, socket)
	changePasswordHandler(io, socket)
	setRightsHandler(io, socket)
	transferOwnershipHandler(io, socket)

	socket.on('toggleLockRoom', async (callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin('lock')
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room } = authResult

		room.locked = !room.locked
		await room.save()
		callback({ success: true, locked: room.locked, message: `Room is now ${room.locked ? 'locked' : 'unlocked'}.` })
		emitMessageToRoom(io, socket.currentUserIP, socket.currentUsername, 'system', room._id, `Room is now ${room.locked ? 'locked' : 'unlocked'}.`)
		emitRoomDetails(io, room._id)
	})

	socket.on('toggleStatusVisibility', async (callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin()
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room } = authResult

		const ip = socket.currentUserIP
		const idx = (room.hiddenStatusIPs || []).indexOf(ip)
		if (idx > -1) {
			room.hiddenStatusIPs.splice(idx, 1)
		} else {
			room.hiddenStatusIPs.push(ip)
		}
		await room.save()
		const hidden = room.hiddenStatusIPs.includes(ip)
		callback({ success: true, hidden, message: `Status is now ${hidden ? 'hidden' : 'visible'}.` })
		emitRoomDetails(io, room._id)
	})

	socket.on('changeRoomName', async ({ newName }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin()
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room, isOwner } = authResult

		if (!isOwner) return callback({ error: 'Only the room owner can change the room name.' })
		if (!newName || newName.trim().length === 0) return callback({ error: 'Room name cannot be empty.' })
		if (newName.trim().length > 50) return callback({ error: 'Room name cannot exceed 50 characters.' })

		const oldName = room.name
		room.name = newName.trim()
		await room.save()
		callback({ success: true, message: 'Room name updated.' })
		emitMessageToRoom(io, 'SYSTEM', 'System', 'system', room._id, `Room name changed from "${oldName}" to "${room.name}".`)
		emitRoomDetails(io, room._id)
	})

	socket.on('adminToggleDefaultFilter', async (callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin('setBadWords')
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room } = authResult

		room.defaultFilter = !room.defaultFilter
		await room.save()
		callback({ success: true, defaultFilter: room.defaultFilter, message: `Default filter is now ${room.defaultFilter ? 'enabled' : 'disabled'}.` })
		emitRoomDetails(io, room._id)
	})

	socket.on('adminUnbanIP', async ({ ipToUnban }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin('ban')
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room } = authResult

		if (!ipToUnban) return callback({ error: 'IP address to unban is required.' })

		const banIdx = room.bannedIPs.findIndex((b) => b.ipAddress === ipToUnban)
		if (banIdx === -1) return callback({ error: 'IP is not banned.' })

		room.bannedIPs.splice(banIdx, 1)
		await room.save()
		callback({ success: true, message: `IP ${ipToUnban} has been unbanned.` })
		emitRoomDetails(io, room._id)
	})
}

module.exports = adminHandler

const { emitRoomDetails } = require('../../utils/socketHelpers')
const createVerifyAdmin = require('../../utils/verifyAdmin')

function setRightsHandler(io, socket) {
	const verifyAdmin = createVerifyAdmin(socket)
	socket.on('setAdminRights', async ({ targetSocketId, newRights }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin()
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room, isOwner } = authResult

		if (!isOwner) return callback({ error: 'Only the room owner can set admin rights.' })

		const targetUser = room.activeUsers.find((u) => u.socketId === targetSocketId)
		if (!targetUser) return callback({ error: 'User not found.' })

		const adminIndex = room.admins.findIndex((a) => a.ip === targetUser.ipAddress)
		if (adminIndex === -1) return callback({ error: 'Target user is not an admin.' })

		room.admins[adminIndex].rights = {
			kick: !!newRights.kick,
			ban: !!newRights.ban,
			lock: !!newRights.lock,
			changePassword: !!newRights.changePassword,
			setBadWords: !!newRights.setBadWords
		}

		await room.save()
		callback({ success: true, message: 'Admin rights updated.' })
		emitRoomDetails(io, room._id)
	})

	socket.on('createRightPreset', async ({ presetName, presetRights }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin()
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room, isOwner } = authResult

		if (!isOwner) return callback({ error: 'Only the room owner can create presets.' })
		if (!presetName) return callback({ error: 'Preset name required.' })

		const existingPreset = room.rightPresets.find((p) => p.name === presetName)
		if (existingPreset) { existingPreset.rights = presetRights }
		else { room.rightPresets.push({ name: presetName, rights: presetRights }) }

		await room.save()
		callback({ success: true, message: 'Preset saved.' })
		emitRoomDetails(io, room._id)
	})
}

module.exports = setRightsHandler

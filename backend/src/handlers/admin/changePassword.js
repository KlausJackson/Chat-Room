const bcrypt = require('bcrypt')
const createVerifyAdmin = require('../../utils/verifyAdmin')

function changePasswordHandler(io, socket) {
	const verifyAdmin = createVerifyAdmin(socket)
	socket.on('adminChangePassword', async ({ newPassword }, callback) => {
		if (typeof callback !== 'function') callback = () => {}
		const authResult = await verifyAdmin('changePassword')
		if (!authResult) return callback({ error: 'Authorization failed.' })
		const { room } = authResult

		room.password = newPassword ? await bcrypt.hash(newPassword.trim(), 10) : null
		await room.save()
		callback({ success: true, message: newPassword ? 'Password updated.' : 'Password removed.' })
	})
}

module.exports = changePasswordHandler

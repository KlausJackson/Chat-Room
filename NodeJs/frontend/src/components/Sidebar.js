import React, { useState } from 'react'
import { socket } from '../services/socket'

function Sidebar({ room, roomInfo, personalStatus, currentUser, isOpen, onClose }) {
	const { users = [], bannedIPs = [], admins = [] } = roomInfo || {}
	const { isAdmin, isOwner, myRights = {} } = personalStatus || {}

	const [showAdmin, setShowAdmin] = useState(false)
	const [newPass, setNewPass] = useState('')
	const [newWords, setNewWords] = useState('')
	const [newRoomName, setNewRoomName] = useState('')
	const [copied, setCopied] = useState(false)

	const copyRoomId = () => {
		navigator.clipboard.writeText(room.id)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const emit = (event, data, onSuccess) => {
		socket.emit(event, data, (res) => {
			if (res?.error) alert(res.error)
			else if (res?.message) {
				if (onSuccess) onSuccess(res)
			}
		})
	}

	const handleKick = (socketId) => emit('kickUser', { socketIdToKick: socketId, reason: 'Kicked by admin' })
	const handleBan = (socketId) => {
		const user = users.find(u => u.socketId === socketId)
		if (!user) return
		if (!window.confirm(`Ban ${user.username}?`)) return
		// We need the IP but it's not exposed to clients.
		// Workaround: prompt for IP (admins see IPs in the admin data).
		const ip = prompt('Enter IP to ban (check admin panel for user IPs):')
		if (ip) emit('adminBanIP', { ipToBan: ip, reason: 'Banned by admin' })
	}
	const handleMakeAdmin = (socketId) => emit('adminMakeAdmin', { targetUserSocketId: socketId })
	const handleRemoveAdmin = (socketId) => emit('removeAdmin', { targetSocketId: socketId })
	const handleTransferOwner = (socketId) => {
		if (!window.confirm('Transfer ownership? You will lose owner rights.')) return
		emit('transferOwnership', { targetUserSocketId: socketId })
	}
	const toggleLock = () => emit('toggleLockRoom', {})
	const changePass = () => {
		emit('adminChangePassword', { newPassword: newPass }, () => setNewPass(''))
	}
	const updateFilter = () => {
		const words = newWords.split(',').map(w => w.trim()).filter(Boolean)
		emit('adminSetFilteredWords', { filteredWords: words }, () => setNewWords(''))
	}
	const toggleDefaultFilter = () => emit('adminToggleDefaultFilter', {})
	const changeRoomNameFn = () => {
		if (!newRoomName.trim()) return
		emit('changeRoomName', { newName: newRoomName.trim() }, () => setNewRoomName(''))
	}
	const handleUnban = (ip) => emit('adminUnbanIP', { ipToUnban: ip })

	const toggleRight = (socketId, rightName, currentVal) => {
		const userE = users.find(u => u.socketId === socketId)
		const fullRights = { ...(userE?.rights || {}), [rightName]: !currentVal }
		emit('setAdminRights', { targetSocketId: socketId, newRights: fullRights })
	}

	const getAvatarColor = (name) => {
		const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#06b6d4', '#3b82f6']
		let hash = 0
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
		return colors[Math.abs(hash) % colors.length]
	}

	return (
		<div className={`sidebar ${isOpen ? 'open' : ''}`}>
			<div className="sidebar-header">
				<div className="sidebar-room-name">{roomInfo.name || room.name}</div>
				<div className="sidebar-room-id">
					<span>ID: {room.id.slice(0, 8)}...</span>
					<button onClick={copyRoomId}>{copied ? '✓ Copied' : 'Copy'}</button>
				</div>
			</div>

			<div className="sidebar-section">
				<div className="sidebar-section-title">Users ({users.length}{roomInfo.maxUsers ? `/${roomInfo.maxUsers}` : ''})</div>
			</div>

			<div className="sidebar-users">
				{users.map((user) => (
					<div key={user.socketId} className="user-item">
						<div className="user-info">
							<div className="user-avatar" style={{ background: getAvatarColor(user.username) }}>
								{user.username[0].toUpperCase()}
							</div>
							<div>
								<div className="user-name">{user.username}</div>
								<div className="user-badges">
									{user.isOwner && <span className="badge badge-owner">Owner</span>}
									{user.isAdmin && !user.isOwner && <span className="badge badge-admin">Admin</span>}
									{user.username === currentUser && <span className="badge badge-you">You</span>}
								</div>
							</div>
						</div>
						{(isAdmin || isOwner) && user.username !== currentUser && (
							<div className="user-actions">
								{myRights.kick && <button className="btn-icon" title="Kick" onClick={() => handleKick(user.socketId)} style={{fontSize:'0.8rem'}}>👢</button>}
								{myRights.ban && <button className="btn-icon" title="Ban" onClick={() => handleBan(user.socketId)} style={{fontSize:'0.8rem'}}>🚫</button>}
								{isOwner && !user.isAdmin && <button className="btn-icon" title="Make Admin" onClick={() => handleMakeAdmin(user.socketId)} style={{fontSize:'0.8rem'}}>⬆️</button>}
								{isOwner && user.isAdmin && <button className="btn-icon" title="Remove Admin" onClick={() => handleRemoveAdmin(user.socketId)} style={{fontSize:'0.8rem'}}>⬇️</button>}
								{isOwner && <button className="btn-icon" title="Transfer Ownership" onClick={() => handleTransferOwner(user.socketId)} style={{fontSize:'0.8rem'}}>👑</button>}
							</div>
						)}
						{isOwner && user.isAdmin && user.username !== currentUser && (
							<div className="rights-editor">
								{['kick', 'ban', 'lock', 'changePassword', 'setBadWords'].map(r => (
									<label key={r}>
										<input type="checkbox" checked={!!user.rights?.[r]} onChange={() => toggleRight(user.socketId, r, user.rights?.[r])} />
										<span>{r}</span>
									</label>
								))}
							</div>
						)}
					</div>
				))}
			</div>

			{(isAdmin || isOwner) && (
				<div className="admin-panel">
					<button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setShowAdmin(!showAdmin)}>
						{showAdmin ? '▾ Hide Admin Panel' : '▸ Admin Panel'}
					</button>
					{showAdmin && (
						<div className="admin-panel-content">
							{myRights.lock && (
								<button className="btn btn-secondary btn-sm" onClick={toggleLock}>
									{roomInfo.locked ? '🔓 Unlock Room' : '🔒 Lock Room'}
								</button>
							)}
							{myRights.changePassword && (
								<div className="admin-row">
									<input className="input" placeholder="New password" value={newPass} onChange={e => setNewPass(e.target.value)} />
									<button className="btn btn-primary btn-sm" onClick={changePass}>Set</button>
								</div>
							)}
							{myRights.setBadWords && (
								<>
									<div className="admin-row">
										<input className="input" placeholder="word1, word2, ..." value={newWords} onChange={e => setNewWords(e.target.value)} />
										<button className="btn btn-primary btn-sm" onClick={updateFilter}>Set</button>
									</div>
									<button className="btn btn-secondary btn-sm" onClick={toggleDefaultFilter}>
										{roomInfo.useDefaultFilter ? '✓ Default Filter ON' : '✕ Default Filter OFF'}
									</button>
								</>
							)}
							{isOwner && (
								<div className="admin-row">
									<input className="input" placeholder="New room name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} maxLength={50} />
									<button className="btn btn-primary btn-sm" onClick={changeRoomNameFn}>Rename</button>
								</div>
							)}
							{myRights.ban && bannedIPs.length > 0 && (
								<div>
									<div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Banned IPs</div>
									{bannedIPs.map((b, i) => (
										<div key={i} className="banned-item">
											<span className="banned-ip">{b.ipAddress}</span>
											<button className="btn btn-ghost btn-sm" onClick={() => handleUnban(b.ipAddress)}>Unban</button>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default Sidebar

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { socket, BACKEND_URL } from '../services/socket'
import Sidebar from './Sidebar'
import MessageList from './MessageList'
import MessageForm from './MessageForm'

function ChatRoom({ username, room, onLeave }) {
	const [messages, setMessages] = useState([])
	const [roomInfo, setRoomInfo] = useState({ users: [] })
	const [personalStatus, setPersonalStatus] = useState({})
	const [showSearch, setShowSearch] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [uploading, setUploading] = useState(false)
	const fileInputRef = useRef(null)

	useEffect(() => {
		const onLoad = (items) => setMessages(items || [])
		const onNew = (msg) => setMessages(prev => [...prev, msg])
		const onRoomDetails = (info) => setRoomInfo(prev => ({ ...prev, ...info }))
		const onAdminDetails = (info) => setRoomInfo(prev => ({ ...prev, ...info }))
		const onPersonal = (status) => setPersonalStatus(status)

		socket.on('loadMessages', onLoad)
		socket.on('newMessage', onNew)
		socket.on('roomDetailsUpdated', onRoomDetails)
		socket.on('adminRoomDetailsUpdated', onAdminDetails)
		socket.on('personalStatus', onPersonal)

		return () => {
			socket.off('loadMessages', onLoad)
			socket.off('newMessage', onNew)
			socket.off('roomDetailsUpdated', onRoomDetails)
			socket.off('adminRoomDetailsUpdated', onAdminDetails)
			socket.off('personalStatus', onPersonal)
		}
	}, [])

	const handleSend = useCallback((text) => {
		if (!text.trim()) return
		socket.emit('sendMessage', { messageText: text }, (res) => {
			if (res?.error) alert(res.error)
		})
	}, [])

	const handleFileUpload = useCallback(async (e) => {
		const file = e.target.files[0]
		if (!file) return
		setUploading(true)
		try {
			const formData = new FormData()
			formData.append('file', file)
			formData.append('roomId', room.id)
			formData.append('socketId', socket.id)
			const res = await fetch(`${BACKEND_URL}/upload`, { method: 'POST', body: formData })
			const data = await res.json()
			if (data.error) alert(data.error)
		} catch (err) {
			alert('Upload failed: ' + err.message)
		} finally {
			setUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}, [room.id])

	const handleSearch = useCallback(() => {
		if (!searchQuery.trim()) return
		socket.emit('searchMessages', { query: searchQuery }, (res) => {
			if (res?.error) alert(res.error)
			else setSearchResults(res.results || [])
		})
	}, [searchQuery])

	const { isAdmin, isOwner } = personalStatus

	return (
		<div className="chat-layout">
			{sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
			<Sidebar
				room={room}
				roomInfo={roomInfo}
				personalStatus={personalStatus}
				currentUser={username}
				isOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
			/>
			<div className="chat-main">
				<div className="chat-header">
					<div className="chat-header-left">
						<button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">☰</button>
						<div>
							<div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{roomInfo.name || room.name}</div>
							<div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
								{roomInfo.users?.length || 0} user{(roomInfo.users?.length || 0) !== 1 ? 's' : ''}
								{roomInfo.locked ? ' · 🔒 Locked' : ''}
							</div>
						</div>
					</div>
					<div className="chat-header-right">
						<button className="btn-icon" onClick={() => setShowSearch(!showSearch)} title="Search">🔍</button>
						<button className="btn btn-secondary btn-sm" onClick={onLeave}>Leave</button>
					</div>
				</div>

				<div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
					<MessageList messages={messages} currentUser={username} />

					{showSearch && (
						<div className="search-overlay">
							<div className="search-header">
								<input
									className="input"
									placeholder="Search messages, usernames, files..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
									autoFocus
								/>
								<button className="btn btn-primary" onClick={handleSearch}>Search</button>
								<button className="btn btn-secondary" onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery('') }}>✕</button>
							</div>
							<div className="search-results">
								{searchResults.length === 0 && searchQuery && <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>No results found</p>}
								{searchResults.map((msg) => (
									<div key={msg._id} className="search-result-item" onClick={() => setShowSearch(false)}>
										<div className="search-result-sender">{msg.username}</div>
										<div className="search-result-content">{msg.type === 'file' ? `📎 ${msg.fileInfo?.name || msg.content}` : msg.content}</div>
										<div className="search-result-time">{new Date(msg.timestamp).toLocaleString()}</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="chat-input-area">
					{uploading && (
						<div className="upload-progress">
							<span>Uploading...</span>
							<div className="upload-progress-bar"><div className="upload-progress-fill" style={{ width: '100%', animation: 'pulse 1s infinite' }} /></div>
						</div>
					)}
					<MessageForm onSendMessage={handleSend} />
					<div className="chat-input-actions">
						<input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
						<button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>📎 File</button>
						{(isAdmin || isOwner) && personalStatus.isHidden !== undefined && (
							<button className="btn btn-ghost btn-sm" onClick={() => socket.emit('toggleStatusVisibility', (r) => r?.error && alert(r.error))}>
								{personalStatus.isHidden ? '👁️ Show Status' : '🙈 Hide Status'}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default ChatRoom

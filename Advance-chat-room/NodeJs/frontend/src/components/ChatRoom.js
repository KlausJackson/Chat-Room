import React, { useState, useEffect, useRef } from 'react'
import { socket } from '../socket'
import Sidebar from './Sidebar'
import MessageList from './MessageList'
import MessageForm from './MessageForm'
import FileUploader from './FileUploader'
import LocationSender from './LocationSender'
import TypingIndicator from './TypingIndicator'


function ChatRoom({ username, room }) {
	const [messages, setMessages] = useState([])
	const [roomInfo, setRoomInfo] = useState({ users: [], banned_ips: [] })
	const [typingUsers, setTypingUsers] = useState([])

	useEffect(() => {
		// Load initial messages/files
		socket.on('load', (items) => {
			setMessages(
				items.map((item) => ({
					...item,
					id: item.id
				}))
			)
		})

		socket.on('message', (message) => {
			setMessages((prevMessages) => [
				...prevMessages,
				{
					...message,
					id: message.id || Math.random().toString(36).substr(2, 9)
				}
			])
		})

		socket.on('location', (location) => {
			setMessages((prevMessages) => [
				...prevMessages,
				{
					...location,
					type: 'location',
					id: location.id || Math.random().toString(36).substr(2, 9)
				}
			])
		})

		socket.on('file', (fileData) => {
			setMessages((prevMessages) => [
				...prevMessages,
				{
					...fileData,
					type: 'file',
					id: fileData.id || Math.random().toString(36).substr(2, 9)
				}
			])
		})

		socket.on('room', (newRoomInfo) => {
			setRoomInfo(newRoomInfo)
		})

		socket.on('userTyping', (data) => {
			setTypingUsers((prev) => {
				if (!prev.find((u) => u.username === data.username)) {
					return [...prev, data]
				}
				return prev
			})
		})

		socket.on('userStoppedTyping', (data) => {
			setTypingUsers((prev) =>
				prev.filter((u) => u.username !== data.username)
			)
		})

		return () => {
			socket.off('load')
			socket.off('message')
			socket.off('location')
			socket.off('file')
			socket.off('room')
			socket.off('userTyping')
			socket.off('userStoppedTyping')
		}
	}, [])

	const handleSendMessage = (text) => {
		if (text.trim() === '') return false
		socket.emit('message', text, (error) => {
			if (error) {
				alert(error)
				return false // Indicate failure
			}
			return true // Indicate success
		})
		socket.emit('no_typing') // Stop typing indicator on send
		return true // Optimistically assume success for UI
	}

	const handleSendFile = (fileData) => {
		// fileData: { filename, data (base64), filetype }
		let retries = 1
		function send() {
			socket.emit('file', fileData, (error) => {
				if (error) {
					if (retries > 0) {
						retries--
						alert(`Error sending file. Retrying...`)
						send()
					} else {
						alert(error)
					}
				}
				// Success is handled by the 'file' event from server updating messages
			})
		}
		send()
	}

	const handleSendLocation = (coords) => {
		// coords: { latitude, longitude }
		socket.emit('location', coords, () => {
			// Callback after server acknowledges, used for cooldown in original
			// The LocationSender component will handle its own cooldown UI
			console.log('Location sent and acknowledged by server.')
		})
	}

	const handleTyping = () => {
		socket.emit('typing', { username })
	}

	const handleStopTyping = () => {
		socket.emit('no_typing')
	}

	// Admin actions for Sidebar
	const handleBanUser = (userToBan) => {
		if (!window.confirm(`Are you sure you want to ban ${userToBan}?`))
			return
		socket.emit('ban', userToBan, (e) => {
			if (e) alert(e)
		})
	}

	const handleUnbanIp = (ipToUnban) => {
		if (!window.confirm(`Are you sure you want to unban IP ${ipToUnban}?`))
			return
		socket.emit('unban', ipToUnban, (e) => {
			if (e) alert(e)
		})
	}

	const handleDownloadChat = () => {
		socket.emit('chat', (e, { data, filename }) => {
			if (e) {
				alert(e)
			} else {
				// downloadFile helper from utils.js
				const { downloadFile: utilDownloadFile } = require('../utils') // Or import at top
				utilDownloadFile(
					JSON.stringify(data, null, 2),
					filename,
					'application/json'
				)
			}
		})
	}

	const handleCloseRoom = () => {
		if (!window.confirm('Are you sure you want to close the server/room?'))
			return
		socket.emit('close', (e) => {
			if (e) alert(e)
		})
	}

	return (
		<div className='chat-room-container flex h-screen'>
			<Sidebar
				roomName={room}
				roomInfo={roomInfo}
				currentUser={username}
				onBanUser={handleBanUser}
				onUnbanIp={handleUnbanIp}
				onDownloadChat={handleDownloadChat}
				onCloseRoom={handleCloseRoom}
			/>
			<div className='chat-main flex flex-col flex-grow'>
				<MessageList messages={messages} currentUser={username} />
				<TypingIndicator
					typingUsers={typingUsers}
					currentUser={username}
				/>
				<div className='chat-input-area p-4 border-t border-gray-300'>
					<MessageForm
						onSendMessage={handleSendMessage}
						onTyping={handleTyping}
						onStopTyping={handleStopTyping}
					/>
					<div className='actions flex space-x-2 mt-2'>
						<FileUploader onSendFile={handleSendFile} />
						<LocationSender onSendLocation={handleSendLocation} />
					</div>
				</div>
			</div>
		</div>
	)
}

export default ChatRoom

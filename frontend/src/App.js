import React, { useEffect, useState, useCallback } from 'react'
import { socket } from './services/socket'
import ChatRoom from './components/ChatRoom'
import Home from './pages/Home'
import './App.css'

function App() {
	const [activeRoom, setActiveRoom] = useState(() => {
		const id = sessionStorage.getItem('activeRoomId')
		const name = sessionStorage.getItem('activeRoomName')
		return id ? { id, name } : null
	})
	const [activeUser, setActiveUser] = useState(() => sessionStorage.getItem('activeUser'))
	const [isConnected, setIsConnected] = useState(socket.connected)
	const [error, setError] = useState(null)

	const clearSession = useCallback(() => {
		sessionStorage.removeItem('activeRoomId')
		sessionStorage.removeItem('activeRoomName')
		sessionStorage.removeItem('activeUser')
		setActiveRoom(null)
		setActiveUser(null)
	}, [])

	useEffect(() => {
		function onConnect() {
			setIsConnected(true)
			const savedId = sessionStorage.getItem('activeRoomId')
			const savedUser = sessionStorage.getItem('activeUser')
			if (savedId && savedUser) {
				socket.emit('joinRoom', { roomId: savedId, username: savedUser }, (res) => {
					if (res.error) {
						clearSession()
						setError(res.error)
					}
				})
			}
		}
		function onDisconnect() {
			setIsConnected(false)
		}
		function onKicked(data) {
			clearSession()
			setError(`You were kicked from ${data.roomName || 'the room'}. Reason: ${data.reason}`)
		}

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on('kicked', onKicked)
		if (socket.connected) onConnect()

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off('kicked', onKicked)
		}
	}, [clearSession])

	const handleCreate = (username, roomName, roomPassword) => {
		socket.emit('createRoom', { roomName, username, roomPassword }, (res) => {
			if (res.error) {
				setError(res.error)
			} else {
				sessionStorage.setItem('activeRoomId', res.room.id)
				sessionStorage.setItem('activeRoomName', res.room.name)
				sessionStorage.setItem('activeUser', username)
				setActiveRoom(res.room)
				setActiveUser(username)
				setError(null)
			}
		})
	}

	const handleJoin = (username, roomId, roomPassword) => {
		socket.emit('joinRoom', { roomId, username, roomPassword }, (res) => {
			if (res.error) {
				setError(res.error)
			} else {
				sessionStorage.setItem('activeRoomId', res.room.id)
				sessionStorage.setItem('activeRoomName', res.room.name)
				sessionStorage.setItem('activeUser', username)
				setActiveRoom(res.room)
				setActiveUser(username)
				setError(null)
			}
		})
	}

	const handleLeave = () => {
		socket.emit('leaveRoom', () => {
			clearSession()
		})
	}

	if (activeRoom && activeUser) {
		return <ChatRoom username={activeUser} room={activeRoom} onLeave={handleLeave} />
	}

	return (
		<Home
			isConnected={isConnected}
			error={error}
			setError={setError}
			onJoin={handleJoin}
			onCreate={handleCreate}
		/>
	)
}

export default App

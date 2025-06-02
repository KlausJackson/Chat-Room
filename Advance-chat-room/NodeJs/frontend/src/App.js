import React, { useEffect, useState } from 'react'
import { socket } from './socket'
import ChatRoom from './components/ChatRoom'
import './App.css' // Basic styling

function App() {
	const [username, setUsername] = useState('')
	const [room, setRoom] = useState('')
	const [isConnected, setIsConnected] = useState(socket.connected)
	const [error, setError] = useState(null)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const user = params.get('username')
		const r = params.get('room')
		const p = params.get('password') // Password for joining

		if (!user || !r) {
			// Maybe redirect to a login/join form page
			alert('Username and Room are required.')
			window.location.href = '/' // Or some other appropriate action
			return
		}

		setUsername(user)
		setRoom(r)

		// Remove password from URL
		if (p) {
			params.delete('password')
			const newUrl = `${window.location.pathname}?${params.toString()}`
			window.history.pushState({}, '', newUrl)
		}

		function onConnect() {
			setIsConnected(true)
			console.log('Connected to socket server')
			socket.emit(
				'join',
				{ username: user, room: r, password: p },
				(joinError) => {
					if (joinError) {
						alert(joinError)
						setError(joinError)
						window.location.href = '/' // Redirect on join error
					}
				}
			)
		}

		function onDisconnect() {
			setIsConnected(false)
			console.log('Disconnected from socket server')
		}

		function onBanned() {
			alert('You have been banned.')
			window.location.href = '/'
		}

		socket.on('connect', onConnect)
		socket.on('disconnect', onDisconnect)
		socket.on('banned', onBanned)

		if (socket.connected) {
			// If already connected (e.g. hot reload)
			onConnect()
		}

		return () => {
			socket.off('connect', onConnect)
			socket.off('disconnect', onDisconnect)
			socket.off('banned', onBanned)
			// Consider emitting a 'leave' event if your backend supports it
			// socket.emit('leave', { username, room });
		}
	}, []) // Empty dependency array means this runs once on mount and cleanup on unmount

	if (error) {
		return (
			<div className='text-red-500 p-4'>
				Error: {error}. Please try joining again.
			</div>
		)
	}

	if (!isConnected && !username && !room) {
		return (
			<div className='p-4'>
				Attempting to connect and join... Ensure username and room are
				in URL.
			</div>
		)
	}

	if (!username || !room) {
		// This case might be hit briefly before URL params are processed
		return <div className='p-4'>Loading user and room information...</div>
	}

	return (
		<div className='app-container'>
			{isConnected ? (
				<ChatRoom username={username} room={room} />
			) : (
				<div className='p-4'>Connecting to chat server...</div>
			)}
		</div>
	)
}

export default App

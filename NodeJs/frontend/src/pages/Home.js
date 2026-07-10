import React, { useState } from 'react'

function Home({ isConnected, error, setError, onJoin, onCreate }) {
	const [username, setUsername] = useState('')
	const [roomField, setRoomField] = useState('')
	const [password, setPassword] = useState('')
	const [mode, setMode] = useState('join')

	const handleSubmit = (e) => {
		e.preventDefault()
		if (!username.trim() || !roomField.trim()) {
			setError('All fields are required.')
			return
		}
		setError(null)
		if (mode === 'create') {
			onCreate(username.trim(), roomField.trim(), password)
		} else {
			onJoin(username.trim(), roomField.trim(), password)
		}
	}

	return (
		<div className="home-page">
			<div className="home-card glass-card">
				<h1 className="home-title">
					{mode === 'create' ? '✨ Create Room' : '🚀 Join Room'}
				</h1>
				<p className="home-subtitle">
					<span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
					{isConnected ? 'Connected' : 'Connecting...'}
				</p>

				{error && <div className="alert alert-error">{error}</div>}

				<form onSubmit={handleSubmit} className="home-form">
					<div>
						<label className="label">Display Name</label>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="input"
							placeholder="Choose a display name"
							maxLength={20}
							required
							autoFocus
						/>
					</div>
					<div>
						<label className="label">{mode === 'create' ? 'Room Name' : 'Room ID'}</label>
						<input
							type="text"
							value={roomField}
							onChange={(e) => setRoomField(e.target.value)}
							className="input"
							placeholder={mode === 'create' ? 'Give your room a name' : 'Paste the room ID'}
							maxLength={mode === 'create' ? 50 : undefined}
							required
						/>
					</div>
					<div>
						<label className="label">Password (optional)</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="input"
							placeholder="Room password"
						/>
					</div>

					<button
						type="submit"
						disabled={!isConnected}
						className="btn btn-primary"
						style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
					>
						{!isConnected ? 'Connecting...' : mode === 'create' ? 'Create Room' : 'Join Room'}
					</button>
				</form>

				<div className="home-toggle">
					<button onClick={() => { setMode(mode === 'create' ? 'join' : 'create'); setError(null); setRoomField('') }}>
						{mode === 'create' ? 'Have a Room ID? Join instead →' : 'Need a room? Create one →'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default Home

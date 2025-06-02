import React, { useState, useRef, useEffect } from 'react'

function MessageForm({ onSendMessage, onTyping, onStopTyping }) {
	const [message, setMessage] = useState('')
	const [isSending, setIsSending] = useState(false)
	const typingTimeoutRef = useRef(null)

	const handleSubmit = (e) => {
		e.preventDefault()
		if (message.trim() === '' || isSending) return

		setIsSending(true)
		const success = onSendMessage(message)
		if (success) {
			// Or use callback from onSendMessage if it provides one
			setMessage('')
		}
		setIsSending(false)
		clearTimeout(typingTimeoutRef.current) // Stop typing on send
		onStopTyping()
	}

	const handleChange = (e) => {
		setMessage(e.target.value)
		onTyping() // Signal typing on every change

		clearTimeout(typingTimeoutRef.current)
		typingTimeoutRef.current = setTimeout(() => {
			onStopTyping()
		}, 1000) // User stopped typing after 1 second of inactivity
	}

	useEffect(() => {
		return () => {
			clearTimeout(typingTimeoutRef.current) // Cleanup timeout on unmount
		}
	}, [])

	return (
		<form id='message-form' onSubmit={handleSubmit} className='flex'>
			<textarea
				name='message'
				value={message}
				onChange={handleChange}
				placeholder='Type your message...'
				rows='2'
				className='flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500'
				disabled={isSending}
			/>
			<button
				type='submit'
				className='bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-r-md disabled:bg-blue-300'
				disabled={isSending || message.trim() === ''}>
				{isSending ? 'Sending...' : 'Send'}
			</button>
		</form>
	)
}

export default MessageForm

import React, { useState, useRef } from 'react'

function MessageForm({ onSendMessage }) {
	const [text, setText] = useState('')
	const inputRef = useRef(null)

	const handleSubmit = (e) => {
		e.preventDefault()
		if (!text.trim()) return
		onSendMessage(text)
		setText('')
		inputRef.current?.focus()
	}

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSubmit(e)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="chat-input-row">
			<textarea
				ref={inputRef}
				className="input"
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Type a message..."
				rows={1}
			/>
			<button type="submit" className="btn btn-primary" disabled={!text.trim()}>Send</button>
		</form>
	)
}

export default MessageForm

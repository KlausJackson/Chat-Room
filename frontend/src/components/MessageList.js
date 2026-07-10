import React, { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'

function MessageList({ messages, currentUser }) {
	const bottomRef = useRef(null)

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	return (
		<div className="messages-container">
			{messages.map((msg, i) => (
				<MessageItem key={msg._id || i} message={msg} currentUser={currentUser} />
			))}
			<div ref={bottomRef} />
		</div>
	)
}

export default MessageList

import React, { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'

function MessageList({ messages, currentUser }) {
	const messagesEndRef = useRef(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(scrollToBottom, [messages]) // Scroll when messages change

	return (
		<div
			id='messages'
			className='messages-container flex-grow overflow-y-auto p-4 space-y-4'>
			{messages.map((msg) => (
				<MessageItem
					key={
						msg.id || `${msg.username}-${msg.time}-${Math.random()}`
					}
					message={msg}
					currentUser={currentUser}
				/>
			))}
			<div ref={messagesEndRef} />
		</div>
	)
}

export default MessageList

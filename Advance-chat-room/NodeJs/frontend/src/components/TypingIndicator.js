import React from 'react'

function TypingIndicator({ typingUsers, currentUser }) {
	const otherTypingUsers = typingUsers.filter(
		(user) => user.username !== currentUser
	)

	if (otherTypingUsers.length === 0) {
		return null // Or <div id="typing-indicator" style={{ display: 'none' }}></div>
	}

	let text
	if (otherTypingUsers.length === 1) {
		text = `${otherTypingUsers[0].username} is typing...`
	} else if (otherTypingUsers.length === 2) {
		text = `${otherTypingUsers[0].username} and ${otherTypingUsers[1].username} are typing...`
	} else {
		text = `${otherTypingUsers.length} users are typing...`
	}

	return (
		<div
			id='typing-indicator'
			className='text-sm text-gray-500 italic px-4 py-1 h-6'>
			{text}
		</div>
	)
}

export default TypingIndicator

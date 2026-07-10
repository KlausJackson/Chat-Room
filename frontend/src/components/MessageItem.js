import React from 'react'
import { marked } from 'marked'
import { BACKEND_URL } from '../services/socket'

marked.setOptions({ breaks: true, gfm: true })

function formatTime(ts) {
	if (!ts) return ''
	const d = new Date(ts)
	return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function MessageItem({ message, currentUser }) {
	const { username, content, type, timestamp, fileInfo } = message
	const isOwn = username === currentUser
	const isSystem = type === 'system'

	if (isSystem) {
		return (
			<div className="message-item system">
				<div className="message-bubble">{content}</div>
			</div>
		)
	}

	if (type === 'file' && fileInfo) {
		const fileUrl = `${BACKEND_URL}${fileInfo.url}`
		const mediaType = (fileInfo.type || '').split('/')[0]
		const sizeStr = fileInfo.size ? `${(fileInfo.size / 1024).toFixed(1)} KB` : ''

		let preview = null
		if (mediaType === 'image') {
			preview = <img src={fileUrl} alt={fileInfo.name} loading="lazy" />
		} else if (mediaType === 'video') {
			preview = <video controls src={fileUrl} />
		} else if (mediaType === 'audio') {
			preview = <audio controls src={fileUrl} style={{ width: '100%' }} />
		}

		return (
			<div className={`message-item ${isOwn ? 'own' : 'other'}`}>
				{!isOwn && <div className="message-sender">{username}</div>}
				<div className="file-bubble">
					<div className="file-info">
						<span>📎</span>
						<a href={fileUrl} target="_blank" rel="noopener noreferrer" download={fileInfo.name}>{fileInfo.name}</a>
						{sizeStr && <span className="file-size">({sizeStr})</span>}
					</div>
					{preview}
				</div>
				<div className="message-time">{formatTime(timestamp)}</div>
			</div>
		)
	}

	const html = marked(content || '')

	return (
		<div className={`message-item ${isOwn ? 'own' : 'other'}`}>
			{!isOwn && <div className="message-sender">{username}</div>}
			<div className="message-bubble" dangerouslySetInnerHTML={{ __html: html }} />
			<div className="message-time">{formatTime(timestamp)}</div>
		</div>
	)
}

export default MessageItem

import React from 'react'
import { marked } from 'marked' // Ensure marked is installed

// Basic setup for marked, you might want to customize it further
marked.setOptions({
	breaks: true, // Convert '\n' in paragraphs into <br>
	gfm: true // Use GitHub Flavored Markdown
})

function MessageItem({ message, currentUser }) {
	const { username, time, text, type } = message
	const isCurrentUser = username === currentUser

	// Common structure for message/file/location provenance
	const renderHeader = () => (
		<p className={`text-sm ${isCurrentUser ? 'text-right' : 'text-left'}`}>
			{!isCurrentUser && (
				<span className='alias font-semibold'>{username}</span>
			)}
			<span
				className={`stamp text-gray-400 ml-2 ${
					isCurrentUser ? 'mr-0' : ''
				}`}>
				{time}
			</span>
			{isCurrentUser && (
				<span className='alias font-semibold ml-2'>You</span>
			)}
		</p>
	)

	const messageAlignmentClass = isCurrentUser
		? 'ml-auto items-end'
		: 'mr-auto items-start'
	const bubbleClass = isCurrentUser
		? 'bg-blue-500 text-white'
		: 'bg-gray-200 text-gray-800'

	if (type === 'location') {
		const { url } = message // Assuming location object has a URL
		return (
			<div
				className={`message-item mb-3 flex flex-col ${messageAlignmentClass} max-w-xs md:max-w-md`}>
				{renderHeader()}
				<div className={`p-2 rounded-lg shadow ${bubbleClass}`}>
					<a
						href={url}
						target='_blank'
						rel='noopener noreferrer'
						className='text-inherit hover:underline'>
						📍 My Current Location
					</a>
				</div>
			</div>
		)
	}

	if (type === 'file') {
		const { filetype, data, filename } = message
		const mediaType = filetype.split('/')[0]
		let fileElement

		if (mediaType === 'image') {
			fileElement = (
				<img
					src={data}
					alt={filename}
					className='max-w-full h-auto rounded-md'
				/>
			)
		} else if (mediaType === 'audio') {
			fileElement = (
				<audio
					controls
					className='w-full h-auto rounded-md'
					style={{ height: '50px' }}>
					<source src={data} type={filetype} />
					Your browser does not support the audio tag.
				</audio>
			)
		} else if (mediaType === 'video') {
			fileElement = (
				<video controls className='max-w-full h-auto rounded-md'>
					<source src={data} type={filetype} />
					Your browser does not support the video tag.
				</video>
			)
		} else if (filetype === 'application/pdf') {
			fileElement = (
				// Embedding PDFs can be tricky and might require a more robust solution or just a link
				// For simplicity, linking to it might be better for cross-browser compatibility
				// <embed src={data} type={filetype} className="w-full h-auto rounded-md" style={{ height: '300px' }} />
				<a
					href={data}
					download={filename}
					target='_blank'
					rel='noopener noreferrer'
					className='text-blue-400 hover:underline'>
					📄 {filename} (PDF)
				</a>
			)
		} else {
			fileElement = (
				<a
					href={data}
					download={filename}
					target='_blank'
					rel='noopener noreferrer'
					className='text-blue-400 hover:underline'>
					🔗 {filename}
				</a>
			)
		}
		return (
			<div
				className={`file-item mb-3 flex flex-col ${messageAlignmentClass} max-w-xs md:max-w-md`}>
				{renderHeader()}
				<div className={`p-2 rounded-lg shadow ${bubbleClass}`}>
					{fileElement}
				</div>
			</div>
		)
	}

	// Default to text message
	// Sanitize or be careful with dangerouslySetInnerHTML if markdown source is not trusted
	// Marked itself tries to sanitize, but double-check its configuration for your security needs.
	const createMarkup = () => {
		// Original logic: .replace(/\n/g, "<br>").replace(/(<br>)+$/, "");
		// marked with `breaks: true` handles \n to <br>. The trailing <br> might need manual removal if problematic.
		let html = marked(text || '') // Ensure text is not undefined
		// Remove trailing <br> tags if they are an issue
		html = html.replace(/(<br\s*\/?>\s*)+$/g, '')
		return { __html: html }
	}

	return (
		<div
			className={`message-item mb-3 flex flex-col ${messageAlignmentClass} max-w-xs md:max-w-md`}>
			{renderHeader()}
			<div
				className={`msg p-2 rounded-lg shadow ${bubbleClass}`}
				dangerouslySetInnerHTML={createMarkup()}
			/>
		</div>
	)
}

export default MessageItem

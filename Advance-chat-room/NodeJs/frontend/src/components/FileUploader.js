import React, { useRef, useState } from 'react'

function FileUploader({ onSendFile }) {
	const fileInputRef = useRef(null)
	const [isUploading, setIsUploading] = useState(false)

	const handleFileButtonClick = () => {
		fileInputRef.current.click() // Trigger hidden file input
	}

	const handleFileChange = (event) => {
		const file = event.target.files[0]
		if (file) {
			if (file.size > 100 * 1024 * 1024) {
				// 100MB
				alert("File can't be larger than 100MB.")
				fileInputRef.current.value = '' // Reset file input
				return
			}
			setIsUploading(true)
			const reader = new FileReader()
			reader.onload = function (e) {
				onSendFile({
					filename: file.name,
					data: e.target.result, // base64 encoded string
					filetype: file.type
				})
				fileInputRef.current.value = '' // Reset file input
				setIsUploading(false)
			}
			reader.onerror = function () {
				alert('Error reading file. Please try again.')
				fileInputRef.current.value = '' // Reset file input
				setIsUploading(false)
			}
			reader.readAsDataURL(file)
		} else {
			//   alert('Please select a file.'); // Not strictly needed as it's triggered by change
		}
	}

	return (
		<div>
			<input
				type='file'
				id='file-input'
				ref={fileInputRef}
				onChange={handleFileChange}
				style={{ display: 'none' }}
				disabled={isUploading}
			/>
			<button
				id='send-file'
				onClick={handleFileButtonClick}
				className='bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md disabled:bg-green-300'
				disabled={isUploading}>
				{isUploading ? 'Uploading...' : 'Send File'}
			</button>
		</div>
	)
}

export default FileUploader

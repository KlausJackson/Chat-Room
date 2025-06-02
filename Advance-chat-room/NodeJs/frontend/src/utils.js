export function downloadFile(data, filename, type) {
	const blob = new Blob([data], { type: type })
	const url = window.URL.createObjectURL(blob)
	const a = document.createElement('a')

	a.style.display = 'none'
	a.href = url
	a.download = filename

	document.body.appendChild(a)
	a.click()
	window.URL.revokeObjectURL(url)
	document.body.removeChild(a)
}

// You might use a state variable and useEffect for countdown in React
// but this is a direct translation if needed.
// For a React way, see LocationSender.js
export function startButtonCountdown(buttonRef, seconds, onEnd) {
	if (!buttonRef.current) return
	buttonRef.current.disabled = true
	let remaining = seconds

	const intervalId = setInterval(() => {
		remaining--
		if (buttonRef.current) {
			buttonRef.current.textContent = `Send Location (${remaining}s)`
		}
		if (remaining <= 0) {
			clearInterval(intervalId)
			if (buttonRef.current) {
				buttonRef.current.disabled = false
				buttonRef.current.textContent = 'Send Location'
			}
			if (onEnd) onEnd()
		}
	}, 1000)
	return intervalId // Return intervalId if you need to clear it prematurely
}

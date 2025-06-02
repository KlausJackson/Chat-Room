import React, { useState, useEffect, useRef } from 'react'

function LocationSender({ onSendLocation }) {
	const [isSending, setIsSending] = useState(false)
	const [cooldown, setCooldown] = useState(0)
	const cooldownIntervalRef = useRef(null)

	useEffect(() => {
		return () => clearInterval(cooldownIntervalRef.current) // Cleanup on unmount
	}, [])

	const handleSendLocation = () => {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser.')
			return
		}
		if (isSending || cooldown > 0) return

		setIsSending(true)
		navigator.geolocation.getCurrentPosition(
			(position) => {
				onSendLocation({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude
				})
				setIsSending(false)
				setCooldown(5) // Start 5 second cooldown
				cooldownIntervalRef.current = setInterval(() => {
					setCooldown((prev) => {
						if (prev <= 1) {
							clearInterval(cooldownIntervalRef.current)
							return 0
						}
						return prev - 1
					})
				}, 1000)
			},
			(error) => {
				alert(`Error getting location: ${error.message}`)
				setIsSending(false)
			}
		)
	}

	return (
		<button
			id='send-location'
			onClick={handleSendLocation}
			className='bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md disabled:bg-yellow-300'
			disabled={isSending || cooldown > 0}>
			{isSending
				? 'Getting...'
				: cooldown > 0
				? `Location (${cooldown}s)`
				: 'Send Location'}
		</button>
	)
}

export default LocationSender

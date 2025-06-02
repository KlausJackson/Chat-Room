import React from 'react'

function Sidebar({
	roomName,
	roomInfo,
	currentUser,
	onBanUser,
	onUnbanIp,
	onDownloadChat,
	onCloseRoom
}) {
	const { users = [], banned_ips = [], admin } = roomInfo || {} // Default to empty arrays if roomInfo is null/undefined

	return (
		<div
			id='sidebar'
			className='sidebar w-64 bg-gray-100 p-4 border-r border-gray-300 flex flex-col'>
			<h2 className='text-xl font-semibold mb-2'>Room: {roomName}</h2>

			{admin === currentUser && (
				<div className='admin-actions mb-4'>
					<h3 className='font-semibold mb-1'>Admin Actions</h3>
					<button
						id='chat'
						onClick={onDownloadChat}
						className='w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-sm mb-1'>
						Download Chat Log
					</button>
					<button
						id='close'
						onClick={onCloseRoom}
						className='w-full bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm'>
						Close Room
					</button>
				</div>
			)}

			<h3 className='font-semibold mb-1'>Users ({users.length})</h3>
			<ul className='user-list mb-4 overflow-y-auto flex-grow'>
				{users.map((user) => (
					<li
						key={user.id || user.username}
						className='text-sm py-1 flex justify-between items-center'>
						<span>
							{user.username}{' '}
							{user.username === currentUser && '(You)'}{' '}
							{user.username === admin && (
								<span className='text-xs text-green-600'>
									(Admin)
								</span>
							)}
						</span>
						{admin === currentUser &&
							user.username !== currentUser && (
								<button
									onClick={() => onBanUser(user.username)}
									className='ban text-xs bg-red-400 hover:bg-red-500 text-white py-0.5 px-1 rounded'
									data-username={user.username}>
									Ban
								</button>
							)}
					</li>
				))}
			</ul>

			{admin === currentUser && banned_ips && banned_ips.length > 0 && (
				<div className='banned-ips'>
					<h3 className='font-semibold mb-1'>Banned IPs</h3>
					<ul className='overflow-y-auto max-h-32'>
						{banned_ips.map((ip) => (
							<li
								key={ip}
								className='text-sm py-1 flex justify-between items-center'>
								<span>{ip}</span>
								<button
									onClick={() => onUnbanIp(ip)}
									className='unban text-xs bg-green-400 hover:bg-green-500 text-white py-0.5 px-1 rounded'
									data-ip={ip}>
									Unban
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}

export default Sidebar

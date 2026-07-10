import io from 'socket.io-client'

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'
export const socket = io(SOCKET_URL)
export const BACKEND_URL = SOCKET_URL

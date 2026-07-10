
const config = {
	port: process.env.PORT || 3000,
	maxFileSize: 100 * 1024 * 1024, // 100MB
	mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chat_room',
	cors: {
		origin: process.env.CORS_ORIGIN || '*', // allow all origins
		methods: ['GET', 'POST'] // allow GET and POST methods
	},
	minio: {
		endPoint: process.env.MINIO_ENDPOINT || 'localhost',
		port: parseInt(process.env.MINIO_PORT, 10) || 9000,
		useSSL: process.env.MINIO_USE_SSL === 'true',
		accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
		secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
		bucket: process.env.MINIO_BUCKET || 'chat-room'
	}
}

module.exports = config

const mongoose = require('mongoose')
const config = require('./config')

function connectDB() {
	mongoose.connect(config.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
		.then(() => console.log('MongoDB connected.'))
		.catch((err) => { console.error('MongoDB connection error:', err.message); process.exit(1) })
}

module.exports = connectDB
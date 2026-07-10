const Minio = require('minio')
const config = require('../config')

const minioClient = new Minio.Client({
	endPoint: config.minio.endPoint,
	port: config.minio.port,
	useSSL: config.minio.useSSL,
	accessKey: config.minio.accessKey,
	secretKey: config.minio.secretKey
})

const BUCKET = config.minio.bucket

/**
 * Upload a file buffer to MinIO.
 * @param {string} objectKey - e.g. "<roomId>/<timestamp>-<safename>"
 * @param {Buffer} buffer - file contents
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} the object key
 */
async function uploadFile(objectKey, buffer, contentType) {
	await minioClient.putObject(BUCKET, objectKey, buffer, buffer.length, {
		'Content-Type': contentType
	})
	return objectKey
}

/**
 * Stream a file from MinIO.
 * @param {string} objectKey
 * @returns {Promise<import('stream').Readable>}
 */
async function getFileStream(objectKey) {
	return minioClient.getObject(BUCKET, objectKey)
}

/**
 * Get object metadata (size, content-type, etc.)
 * @param {string} objectKey
 * @returns {Promise<import('minio').BucketItemStat>}
 */
async function getFileStat(objectKey) {
	return minioClient.statObject(BUCKET, objectKey)
}

module.exports = { uploadFile, getFileStream, getFileStat, BUCKET }

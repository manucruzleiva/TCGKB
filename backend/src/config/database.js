import mongoose from 'mongoose'
import { buildMongoUri, isDatabaseConfigured } from '../utils/mongoUri.js'
import log from '../utils/logger.js'

const MODULE = 'Database'

const connectDB = async () => {
  try {
    // Skip if already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection
    }

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      throw new Error('Database not configured. Set DB_ENDPOINT + DB_CLIENT_ID + DB_CLIENT_SECRET, or MONGODB_URI')
    }

    const uri = buildMongoUri()
    const conn = await mongoose.connect(uri, {
      // Serverless-friendly options
      bufferCommands: false,
      maxPoolSize: 10,
    })

    log.info(MODULE, `MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    log.error(MODULE, `MongoDB connection error: ${error.message}`)
    // Don't exit in serverless - throw error instead
    throw error
  }
}

export default connectDB

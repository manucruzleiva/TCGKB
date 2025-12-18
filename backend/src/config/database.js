import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    // Skip if already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Serverless-friendly options
      bufferCommands: false,
      maxPoolSize: 10,
    })

    console.log(`MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    // Don't exit in serverless - throw error instead
    throw error
  }
}

export default connectDB

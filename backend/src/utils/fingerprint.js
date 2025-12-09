import crypto from 'crypto'

/**
 * Generate a fingerprint from IP and User-Agent
 * Used for anonymous reactions to prevent duplicate votes
 */
export const generateFingerprint = (req) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  const userAgent = req.headers['user-agent'] || 'unknown'

  const data = `${ip}:${userAgent}`

  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
}

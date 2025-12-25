/**
 * Admin Routes
 * Protected routes for administrative tasks
 */
import express from 'express'
import fixSupertypeCache from '../scripts/fixSupertypeCache.js'
import log from '../utils/logger.js'

const router = express.Router()
const MODULE = 'AdminRoutes'

/**
 * POST /api/admin/fix-cache
 * Manually trigger cache fix for supertype field
 *
 * Security: Requires ADMIN_SECRET in query params
 */
router.post('/fix-cache', async (req, res) => {
  try {
    // Simple security check via query param
    const { secret } = req.query

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      log.warn(MODULE, 'Unauthorized cache fix attempt')
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - invalid or missing secret'
      })
    }

    log.info(MODULE, 'Starting manual cache fix...')

    const stats = await fixSupertypeCache()

    log.info(MODULE, 'Cache fix completed successfully')

    res.json({
      success: true,
      message: 'Cache fixed successfully',
      stats
    })

  } catch (error) {
    log.error(MODULE, 'Cache fix failed:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

/**
 * GET /api/admin/test-card/:cardId
 * Test fetching a single card from Pokemon TCG SDK
 *
 * Security: Requires ADMIN_SECRET in query params
 */
router.get('/test-card/:cardId', async (req, res) => {
  try {
    const { secret } = req.query

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - invalid or missing secret'
      })
    }

    const { cardId } = req.params
    const pokemon = (await import('pokemontcgsdk')).default
    pokemon.configure({ apiKey: process.env.POKEMON_TCG_API_KEY })

    log.info(MODULE, `Testing card fetch for: ${cardId}`)

    let result = { cardId, apiKey: process.env.POKEMON_TCG_API_KEY ? 'SET' : 'NOT SET' }

    try {
      const card = await pokemon.card.find(cardId)
      result.success = true
      result.card = {
        id: card.id,
        name: card.name,
        supertype: card.supertype,
        subtypes: card.subtypes,
        set: card.set?.name
      }
    } catch (error) {
      result.success = false
      result.error = error.message
      result.errorStack = error.stack
    }

    res.json(result)

  } catch (error) {
    log.error(MODULE, 'Test card failed:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
})

export default router

import Reprint from '../models/Reprint.js'
import CardCache from '../models/CardCache.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('ReprintsController')
const MODULE = 'ReprintsController'

/**
 * Normalize a card name for comparison
 */
const normalizeName = (name) => {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normalize attack/ability text for comparison
 */
const normalizeText = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract key attributes from a Pokemon card for matching
 */
const extractPokemonAttributes = (card) => {
  const attacks = (card.attacks || []).map(a => ({
    name: normalizeName(a.name),
    damage: a.damage || '',
    cost: a.cost || []
  }))

  const abilities = (card.abilities || []).map(a => ({
    name: normalizeName(a.name),
    text: normalizeText(a.text)
  }))

  return {
    hp: parseInt(card.hp) || 0,
    attacks,
    abilities,
    types: card.types || [],
    subtypes: card.subtypes || []
  }
}

/**
 * Calculate similarity score between two cards (0-100)
 */
const calculateSimilarity = (card1, card2) => {
  let score = 0
  let maxScore = 0

  // Name match (exact normalized name = +40 points)
  maxScore += 40
  const name1 = normalizeName(card1.name)
  const name2 = normalizeName(card2.name)
  if (name1 === name2) {
    score += 40
  } else if (name1.includes(name2) || name2.includes(name1)) {
    score += 20
  }

  // HP match (same HP = +10 points)
  maxScore += 10
  const hp1 = parseInt(card1.hp) || 0
  const hp2 = parseInt(card2.hp) || 0
  if (hp1 === hp2 && hp1 > 0) {
    score += 10
  } else if (Math.abs(hp1 - hp2) <= 10) {
    score += 5
  }

  // Attack match
  const attacks1 = card1.attacks || []
  const attacks2 = card2.attacks || []

  if (attacks1.length > 0 || attacks2.length > 0) {
    maxScore += 30
    let attackMatchScore = 0
    const maxAttacks = Math.max(attacks1.length, attacks2.length)

    for (const a1 of attacks1) {
      for (const a2 of attacks2) {
        const nameMatch = normalizeName(a1.name) === normalizeName(a2.name)
        const damageMatch = a1.damage === a2.damage

        if (nameMatch && damageMatch) {
          attackMatchScore += 30 / maxAttacks
        } else if (nameMatch) {
          attackMatchScore += 15 / maxAttacks
        }
      }
    }
    score += Math.min(30, attackMatchScore)
  }

  // Ability match
  const abilities1 = card1.abilities || []
  const abilities2 = card2.abilities || []

  if (abilities1.length > 0 || abilities2.length > 0) {
    maxScore += 20
    for (const ab1 of abilities1) {
      for (const ab2 of abilities2) {
        if (normalizeName(ab1.name) === normalizeName(ab2.name)) {
          score += 10
          if (normalizeText(ab1.text) === normalizeText(ab2.text)) {
            score += 10
          }
        }
      }
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
}

/**
 * Determine reprint type based on card comparison
 */
const determineReprintType = (card1, card2) => {
  const name1 = normalizeName(card1.name)
  const name2 = normalizeName(card2.name)

  // Check if it's a promo
  if (card2.set?.id?.toLowerCase().includes('promo') ||
      card2.rarity?.toLowerCase().includes('promo')) {
    return 'promo'
  }

  // Check attacks and abilities for exact match
  const attacks1 = (card1.attacks || []).map(a => `${normalizeName(a.name)}:${a.damage}`).sort().join('|')
  const attacks2 = (card2.attacks || []).map(a => `${normalizeName(a.name)}:${a.damage}`).sort().join('|')
  const abilities1 = (card1.abilities || []).map(a => normalizeName(a.name)).sort().join('|')
  const abilities2 = (card2.abilities || []).map(a => normalizeName(a.name)).sort().join('|')

  if (attacks1 === attacks2 && abilities1 === abilities2 && parseInt(card1.hp) === parseInt(card2.hp)) {
    // Same mechanics - check if it's alternate art
    if (card1.images?.small !== card2.images?.small ||
        card1.number !== card2.number) {
      // Check for special art indicators
      if (card2.rarity?.toLowerCase().includes('rare illustration') ||
          card2.rarity?.toLowerCase().includes('special art') ||
          card2.rarity?.toLowerCase().includes('art rare')) {
        return 'special_art'
      }
      return 'alternate_art'
    }
    return 'exact'
  }

  // Different mechanics but same name
  return 'alternate_art'
}

/**
 * Run reprint detection for Pokemon cards
 * @route POST /api/reprints/detect
 */
export const detectReprints = async (req, res) => {
  try {
    const { tcgSystem = 'pokemon', limit = 1000, minConfidence = 70 } = req.body

    log.info(MODULE, `Starting reprint detection for ${tcgSystem}`)

    // Get all cached cards
    const cards = await CardCache.find({ tcgSystem }).select('cardId data')
    log.info(MODULE, `Found ${cards.length} cards to process`)

    // Group cards by normalized name
    const nameGroups = new Map()

    for (const card of cards) {
      const normalizedName = normalizeName(card.data.name)
      if (!normalizedName) continue

      if (!nameGroups.has(normalizedName)) {
        nameGroups.set(normalizedName, [])
      }
      nameGroups.get(normalizedName).push(card)
    }

    let groupsCreated = 0
    let groupsUpdated = 0
    let cardsProcessed = 0

    // Process groups with more than one card (potential reprints)
    for (const [normalizedName, groupCards] of nameGroups) {
      if (groupCards.length < 2) continue

      cardsProcessed += groupCards.length

      // Sort by release date (oldest first)
      groupCards.sort((a, b) => {
        const dateA = new Date(a.data.set?.releaseDate || '2099-01-01')
        const dateB = new Date(b.data.set?.releaseDate || '2099-01-01')
        return dateA - dateB
      })

      const canonical = groupCards[0]
      const variants = []

      // Compare each card with the canonical
      for (let i = 1; i < groupCards.length; i++) {
        const variant = groupCards[i]
        const similarity = calculateSimilarity(canonical.data, variant.data)

        if (similarity >= minConfidence) {
          variants.push({
            cardId: variant.cardId,
            reprintType: determineReprintType(canonical.data, variant.data),
            setId: variant.data.set?.id,
            setName: variant.data.set?.name,
            releaseDate: variant.data.set?.releaseDate ? new Date(variant.data.set.releaseDate) : null,
            imageUrl: variant.data.images?.small,
            rarity: variant.data.rarity,
            autoDetected: true,
            confidence: similarity,
            needsReview: similarity < 90
          })
        }
      }

      if (variants.length > 0) {
        // Upsert the reprint group
        const result = await Reprint.findOneAndUpdate(
          {
            tcgSystem,
            normalizedName
          },
          {
            $set: {
              canonicalName: canonical.data.name,
              tcgSystem,
              canonicalCardId: canonical.cardId,
              normalizedName,
              variantCount: variants.length,
              matchingAttributes: extractPokemonAttributes(canonical.data),
              lastUpdated: new Date()
            },
            $addToSet: {
              variants: { $each: variants }
            }
          },
          { upsert: true, new: true }
        )

        if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
          groupsCreated++
        } else {
          groupsUpdated++
        }
      }
    }

    log.info(MODULE, `Detection complete: ${groupsCreated} groups created, ${groupsUpdated} updated`)

    res.json({
      success: true,
      data: {
        cardsProcessed,
        groupsCreated,
        groupsUpdated,
        totalGroups: await Reprint.countDocuments({ tcgSystem })
      }
    })
  } catch (error) {
    log.error(MODULE, 'Detection failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to detect reprints'
    })
  }
}

/**
 * Get reprints for a specific card
 * @route GET /api/reprints/:cardId
 */
export const getCardReprints = async (req, res) => {
  try {
    const { cardId } = req.params

    const reprintGroup = await Reprint.findReprintsForCard(cardId)

    if (!reprintGroup) {
      return res.json({
        success: true,
        data: {
          hasReprints: false,
          reprints: []
        }
      })
    }

    // Get all card IDs in this group
    const allCardIds = reprintGroup.getAllCardIds()

    // Fetch card data for all variants
    const cards = await CardCache.find({
      cardId: { $in: allCardIds }
    }).select('cardId data')

    const cardMap = new Map(cards.map(c => [c.cardId, c.data]))

    // Build response with full card data
    const reprints = reprintGroup.variants.map(v => ({
      cardId: v.cardId,
      reprintType: v.reprintType,
      setId: v.setId,
      setName: v.setName,
      releaseDate: v.releaseDate,
      imageUrl: v.imageUrl,
      rarity: v.rarity,
      confidence: v.confidence,
      cardData: cardMap.get(v.cardId) || null
    }))

    // Add canonical card to the list
    reprints.unshift({
      cardId: reprintGroup.canonicalCardId,
      reprintType: 'original',
      setId: cardMap.get(reprintGroup.canonicalCardId)?.set?.id,
      setName: cardMap.get(reprintGroup.canonicalCardId)?.set?.name,
      releaseDate: cardMap.get(reprintGroup.canonicalCardId)?.set?.releaseDate,
      imageUrl: cardMap.get(reprintGroup.canonicalCardId)?.images?.small,
      rarity: cardMap.get(reprintGroup.canonicalCardId)?.rarity,
      confidence: 100,
      cardData: cardMap.get(reprintGroup.canonicalCardId) || null
    })

    res.json({
      success: true,
      data: {
        hasReprints: true,
        canonicalName: reprintGroup.canonicalName,
        count: reprints.length,
        reprints
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get reprints failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get reprints'
    })
  }
}

/**
 * Get reprint statistics
 * @route GET /api/reprints/stats
 */
export const getReprintStats = async (req, res) => {
  try {
    const { tcgSystem = 'pokemon' } = req.query

    const stats = await Reprint.aggregate([
      { $match: { tcgSystem } },
      {
        $group: {
          _id: null,
          totalGroups: { $sum: 1 },
          totalVariants: { $sum: '$variantCount' },
          avgVariantsPerGroup: { $avg: '$variantCount' },
          maxVariants: { $max: '$variantCount' }
        }
      }
    ])

    const reprintTypeStats = await Reprint.aggregate([
      { $match: { tcgSystem } },
      { $unwind: '$variants' },
      {
        $group: {
          _id: '$variants.reprintType',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        ...stats[0],
        byType: reprintTypeStats.reduce((acc, t) => {
          acc[t._id] = t.count
          return acc
        }, {})
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get stats failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get reprint stats'
    })
  }
}

/**
 * Search for cards with reprints
 * @route GET /api/reprints/search
 */
export const searchReprints = async (req, res) => {
  try {
    const {
      query,
      tcgSystem = 'pokemon',
      page = 1,
      limit = 20
    } = req.query

    const filter = { tcgSystem }

    if (query) {
      filter.$or = [
        { canonicalName: { $regex: query, $options: 'i' } },
        { normalizedName: { $regex: query.toLowerCase(), $options: 'i' } }
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [reprints, total] = await Promise.all([
      Reprint.find(filter)
        .sort({ variantCount: -1, canonicalName: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('canonicalName canonicalCardId variantCount variants'),
      Reprint.countDocuments(filter)
    ])

    res.json({
      success: true,
      data: {
        reprints: reprints.map(r => ({
          canonicalName: r.canonicalName,
          canonicalCardId: r.canonicalCardId,
          variantCount: r.variantCount,
          previewVariants: r.variants.slice(0, 5).map(v => ({
            cardId: v.cardId,
            reprintType: v.reprintType,
            imageUrl: v.imageUrl
          }))
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Search failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to search reprints'
    })
  }
}

import crypto from 'crypto'

/**
 * Generate a unique hash for a deck based on its card composition.
 * The hash is independent of card order and includes both cardId and quantity.
 *
 * @param {Array} cards - Array of { cardId, quantity } objects
 * @returns {string} - SHA256 hash of the deck composition
 */
export function generateDeckHash(cards) {
  if (!cards || cards.length === 0) {
    return null
  }

  // Normalize and sort cards by cardId for consistent hashing
  // Format: "cardId:quantity" sorted alphabetically
  const normalized = cards
    .map(card => `${card.cardId}:${card.quantity}`)
    .sort()
    .join('|')

  // Generate SHA256 hash
  const hash = crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex')

  return hash
}

/**
 * Compare two deck compositions and return similarity percentage.
 * Uses Jaccard similarity on the set of cardIds.
 *
 * @param {Array} cards1 - First deck's cards
 * @param {Array} cards2 - Second deck's cards
 * @returns {number} - Similarity percentage (0-100)
 */
export function calculateDeckSimilarity(cards1, cards2) {
  if (!cards1?.length || !cards2?.length) {
    return 0
  }

  // Create sets of cardIds
  const set1 = new Set(cards1.map(c => c.cardId))
  const set2 = new Set(cards2.map(c => c.cardId))

  // Calculate intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)))

  // Calculate union
  const union = new Set([...set1, ...set2])

  // Jaccard similarity
  const similarity = (intersection.size / union.size) * 100

  return Math.round(similarity)
}

/**
 * Calculate weighted similarity considering quantities.
 * More accurate for detecting near-duplicates.
 *
 * @param {Array} cards1 - First deck's cards
 * @param {Array} cards2 - Second deck's cards
 * @returns {number} - Weighted similarity percentage (0-100)
 */
export function calculateWeightedSimilarity(cards1, cards2) {
  if (!cards1?.length || !cards2?.length) {
    return 0
  }

  // Create maps of cardId -> quantity
  const map1 = new Map(cards1.map(c => [c.cardId, c.quantity]))
  const map2 = new Map(cards2.map(c => [c.cardId, c.quantity]))

  // Get all unique cardIds
  const allCardIds = new Set([...map1.keys(), ...map2.keys()])

  let matchedQuantity = 0
  let totalQuantity = 0

  for (const cardId of allCardIds) {
    const qty1 = map1.get(cardId) || 0
    const qty2 = map2.get(cardId) || 0

    // Add the minimum (matched) quantity
    matchedQuantity += Math.min(qty1, qty2)
    // Add the maximum (total needed) quantity
    totalQuantity += Math.max(qty1, qty2)
  }

  if (totalQuantity === 0) return 0

  const similarity = (matchedQuantity / totalQuantity) * 100
  return Math.round(similarity)
}

/**
 * Check if a deck is an exact duplicate (same hash).
 *
 * @param {string} hash - Hash to check
 * @param {Model} DeckModel - Mongoose Deck model
 * @param {string} excludeDeckId - Deck ID to exclude (for updates)
 * @returns {Promise<Object|null>} - Matching deck or null
 */
export async function findExactDuplicate(hash, DeckModel, excludeDeckId = null) {
  if (!hash) return null

  const query = { compositionHash: hash }
  if (excludeDeckId) {
    query._id = { $ne: excludeDeckId }
  }

  return DeckModel.findOne(query)
    .select('_id name userId isPublic createdAt')
    .populate('userId', 'username')
    .lean()
}

/**
 * Find similar decks based on weighted similarity.
 *
 * @param {Array} cards - Cards to compare
 * @param {Model} DeckModel - Mongoose Deck model
 * @param {Object} options - Options { threshold, limit, excludeDeckId, onlyPublic }
 * @returns {Promise<Array>} - Array of { deck, similarity } objects
 */
export async function findSimilarDecks(cards, DeckModel, options = {}) {
  const {
    threshold = 70, // Minimum similarity percentage
    limit = 5,
    excludeDeckId = null,
    onlyPublic = true
  } = options

  if (!cards?.length) return []

  // Get candidate decks
  const query = onlyPublic ? { isPublic: true } : {}
  if (excludeDeckId) {
    query._id = { $ne: excludeDeckId }
  }

  const candidateDecks = await DeckModel.find(query)
    .select('_id name cards userId isPublic createdAt')
    .populate('userId', 'username')
    .limit(100) // Limit candidates for performance
    .lean()

  // Calculate similarity for each
  const results = candidateDecks
    .map(deck => ({
      deck: {
        _id: deck._id,
        name: deck.name,
        userId: deck.userId,
        isPublic: deck.isPublic,
        createdAt: deck.createdAt,
        totalCards: deck.cards.reduce((sum, c) => sum + c.quantity, 0)
      },
      similarity: calculateWeightedSimilarity(cards, deck.cards)
    }))
    .filter(r => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return results
}

export default {
  generateDeckHash,
  calculateDeckSimilarity,
  calculateWeightedSimilarity,
  findExactDuplicate,
  findSimilarDecks
}

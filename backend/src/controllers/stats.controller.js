import CardCache from '../models/CardCache.js'
import Comment from '../models/Comment.js'
import Reaction from '../models/Reaction.js'
import User from '../models/User.js'
import log from '../utils/logger.js'

// Cache for relationship map (30 min TTL)
let relationshipCache = { data: null, timestamp: 0 }
const RELATIONSHIP_CACHE_TTL = 30 * 60 * 1000

const MODULE = 'StatsController'

// GitHub repo info
const GITHUB_OWNER = 'manucruzleiva'
const GITHUB_REPO = 'TCGKB'

// Cache for roadmap (1 hour TTL)
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
let roadmapCache = { data: null, timestamp: 0 }

/**
 * Get platform statistics
 */
export const getStats = async (req, res) => {
  try {
    const [totalCards, pokemonCards, riftboundCards, totalComments, totalReactions, totalUsers] = await Promise.all([
      CardCache.countDocuments(),
      CardCache.countDocuments({ tcgSystem: 'pokemon' }),
      CardCache.countDocuments({ tcgSystem: 'riftbound' }),
      Comment.countDocuments({ isModerated: false }),
      Reaction.countDocuments(),
      User.countDocuments()
    ])

    log.info(MODULE, 'Stats retrieved successfully')

    res.status(200).json({
      success: true,
      data: {
        totalCards,
        pokemonCards,
        riftboundCards,
        totalComments,
        totalReactions,
        totalUsers
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get stats failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    })
  }
}

/**
 * Get detailed statistics with distributions
 */
export const getDetailedStats = async (req, res) => {
  try {
    // Comment distribution by card
    const commentDistribution = await Comment.aggregate([
      { $match: { isModerated: false } },
      {
        $group: {
          _id: '$cardId',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$count',
          cards: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Format: { "1 comment": 5 cards, "2 comments": 3 cards, etc }
    const commentDistributionFormatted = commentDistribution.reduce((acc, item) => {
      acc[`${item._id}`] = item.cards
      return acc
    }, {})

    // Reaction breakdown by emoji
    const reactionBreakdown = await Reaction.aggregate([
      {
        $group: {
          _id: '$emoji',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    const reactionBreakdownFormatted = reactionBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // User categories - using isInactive flag (computed daily by cron)
    const DEV_EMAILS = ['shieromanu@gmail.com']

    const [totalUsers, inactiveCount, adminCount, devCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isInactive: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({
        $or: [
          { isDev: true },
          { email: { $in: DEV_EMAILS } }
        ]
      })
    ])

    const activeUsers = totalUsers - inactiveCount

    const userCategories = {
      active: activeUsers,
      inactive: inactiveCount,
      admins: adminCount,
      devs: devCount
    }

    // Top commented cards
    const topCommentedCards = await Comment.aggregate([
      { $match: { isModerated: false } },
      {
        $group: {
          _id: '$cardId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    // Cards with no comments
    const totalCards = await CardCache.countDocuments()
    const cardsWithComments = await Comment.distinct('cardId', { isModerated: false })
    const cardsWithoutComments = totalCards - cardsWithComments.length

    log.info(MODULE, 'Detailed stats retrieved successfully')

    res.status(200).json({
      success: true,
      data: {
        commentDistribution: commentDistributionFormatted,
        reactionBreakdown: reactionBreakdownFormatted,
        userCategories,
        topCommentedCards: topCommentedCards.map(c => ({
          cardId: c._id,
          comments: c.count
        })),
        commentStats: {
          cardsWithComments: cardsWithComments.length,
          cardsWithoutComments
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get detailed stats failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get detailed statistics'
    })
  }
}

/**
 * Parse TODO.md and return roadmap items
 */
const parseTodoMarkdown = (content) => {
  const lines = content.split('\n')
  const priorities = []
  let currentPriority = null
  let currentSection = null
  let currentSubItems = []

  for (const line of lines) {
    // Match priority headers: ## Prioridad 1: UX/UI
    const priorityMatch = line.match(/^##\s+Prioridad\s+(\d+):\s*(.+)$/i)
    if (priorityMatch) {
      // Save previous priority if exists
      if (currentPriority) {
        if (currentSection && currentSubItems.length > 0) {
          currentPriority.sections.push({
            name: currentSection,
            items: currentSubItems
          })
        }
        priorities.push(currentPriority)
      }
      currentPriority = {
        level: parseInt(priorityMatch[1]),
        name: priorityMatch[2].trim(),
        sections: []
      }
      currentSection = null
      currentSubItems = []
      continue
    }

    // Skip completado section
    if (line.match(/^##\s+Completado/i) || line.match(/^##\s+Notas/i)) {
      // Save current priority before breaking
      if (currentPriority) {
        if (currentSection && currentSubItems.length > 0) {
          currentPriority.sections.push({
            name: currentSection,
            items: currentSubItems
          })
        }
        priorities.push(currentPriority)
        currentPriority = null
      }
      break
    }

    // Match section headers: ### Sistema de Avatares
    const sectionMatch = line.match(/^###\s+(.+)$/)
    if (sectionMatch && currentPriority) {
      // Save previous section
      if (currentSection && currentSubItems.length > 0) {
        currentPriority.sections.push({
          name: currentSection,
          items: currentSubItems
        })
      }
      currentSection = sectionMatch[1].trim()
      currentSubItems = []
      continue
    }

    // Match todo items: - [ ] or - [x]
    const itemMatch = line.match(/^-\s+\[([ xX])\]\s+(.+)$/)
    if (itemMatch && currentPriority) {
      const completed = itemMatch[1].toLowerCase() === 'x'
      let text = itemMatch[2].trim()
      // Remove bold markers
      text = text.replace(/\*\*(.+?)\*\*/g, '$1')
      // Remove trailing colons
      text = text.replace(/:$/, '')

      currentSubItems.push({
        text,
        completed
      })
    }
  }

  // Save last priority if exists
  if (currentPriority) {
    if (currentSection && currentSubItems.length > 0) {
      currentPriority.sections.push({
        name: currentSection,
        items: currentSubItems
      })
    }
    priorities.push(currentPriority)
  }

  // Calculate stats
  let totalItems = 0
  let completedItems = 0

  priorities.forEach(p => {
    p.sections.forEach(s => {
      s.items.forEach(item => {
        totalItems++
        if (item.completed) completedItems++
      })
      // Calculate section completion
      const sectionTotal = s.items.length
      const sectionCompleted = s.items.filter(i => i.completed).length
      s.progress = sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0
      s.completedCount = sectionCompleted
      s.totalCount = sectionTotal
    })
    // Calculate priority completion
    const priorityTotal = p.sections.reduce((acc, s) => acc + s.totalCount, 0)
    const priorityCompleted = p.sections.reduce((acc, s) => acc + s.completedCount, 0)
    p.progress = priorityTotal > 0 ? Math.round((priorityCompleted / priorityTotal) * 100) : 0
    p.completedCount = priorityCompleted
    p.totalCount = priorityTotal
  })

  return {
    priorities,
    stats: {
      total: totalItems,
      completed: completedItems,
      pending: totalItems - completedItems,
      progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    }
  }
}

/**
 * Get roadmap from TODO.md
 */
export const getRoadmap = async (req, res) => {
  try {
    const now = Date.now()

    // Return cached data if still valid
    if (roadmapCache.data && (now - roadmapCache.timestamp) < CACHE_TTL) {
      log.info(MODULE, 'Roadmap returned from cache')
      return res.status(200).json({
        success: true,
        data: roadmapCache.data,
        cached: true
      })
    }

    // Fetch TODO.md from GitHub
    const response = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/TODO.md`,
      {
        headers: {
          'User-Agent': 'TCGKB-App'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub raw returned ${response.status}`)
    }

    const content = await response.text()
    const roadmap = parseTodoMarkdown(content)

    // Cache the result
    roadmapCache = {
      data: roadmap,
      timestamp: now
    }

    log.info(MODULE, `Roadmap parsed: ${roadmap.stats.total} items, ${roadmap.stats.completed} completed`)

    res.status(200).json({
      success: true,
      data: roadmap,
      cached: false
    })
  } catch (error) {
    log.error(MODULE, 'Get roadmap failed', error)

    // Return cached data even if expired, as fallback
    if (roadmapCache.data) {
      return res.status(200).json({
        success: true,
        data: roadmapCache.data,
        cached: true,
        stale: true
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get roadmap'
    })
  }
}

/**
 * Add item to TODO.md roadmap via GitHub API
 */
// Section key to name mapping
const SECTION_MAP = {
  'navegacion-menu': 'Navegación / Menú',
  'homepage-refresh': 'Homepage Refresh',
  'smart-mentions': 'Smart Mentions System',
  'avatares': 'Sistema de Avatares',
  'relationship-map': 'Relationship Map',
  'reprints': 'Sistema de Reprints',
  'catalogo': 'Catálogo (/catalog)',
  'binder': 'Binder / Colección Personal',
  'fans-artistas': 'Sistema de Fans de Artistas',
  'diseno-grafico': 'Overhaul de Diseño Gráfico',
  'decks': 'Decks',
  'autenticacion': 'Autenticación / Usuario',
  'ranking-hibrido': 'Ranking Híbrido de Popularidad',
  'dev-dashboard': 'Dev Dashboard',
  'bug-reporter': 'Bug Reporter - Integraciones',
  'reputacion': 'Sistema de Reputación'
}

export const addRoadmapItem = async (req, res) => {
  try {
    const { title, description, priority, section, estimatedTokens, estimatedHours } = req.body

    if (!title || !priority || !section) {
      return res.status(400).json({
        success: false,
        message: 'Title, priority, and section are required'
      })
    }

    // Validate priority
    if (!['1', '2', '3'].includes(String(priority))) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be 1, 2, or 3'
      })
    }

    // Convert section key to name
    const sectionName = SECTION_MAP[section] || section

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    if (!GITHUB_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'GitHub integration not configured'
      })
    }

    // Get current TODO.md content and SHA
    const fileResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/TODO.md`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    if (!fileResponse.ok) {
      const errorData = await fileResponse.json().catch(() => ({}))
      log.error(MODULE, 'Failed to fetch TODO.md from GitHub', errorData)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch TODO.md'
      })
    }

    const fileData = await fileResponse.json()
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8')
    const sha = fileData.sha

    // Format the new item
    let newItem = `- [ ] **${title}**`
    if (estimatedTokens || estimatedHours) {
      const estimates = []
      if (estimatedTokens) estimates.push(`~${estimatedTokens}K tokens`)
      if (estimatedHours) estimates.push(`~${estimatedHours}h`)
      newItem += ` \`${estimates.join(' | ')}\``
    }
    newItem += '\n'
    if (description) {
      // Add sub-items from description (split by newlines or semicolons)
      const subItems = description.split(/[;\n]/).filter(s => s.trim())
      subItems.forEach(subItem => {
        newItem += `  - ${subItem.trim()}\n`
      })
    }

    // Find the correct section and insert the item
    const lines = currentContent.split('\n')
    const priorityHeader = `## Prioridad ${priority}:`
    const sectionHeader = `### ${sectionName}`

    let insertIndex = -1
    let inCorrectPriority = false
    let inCorrectSection = false
    let lastItemInSection = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for priority header
      if (line.startsWith('## Prioridad')) {
        inCorrectPriority = line.includes(priorityHeader.substring(3)) // Match "Prioridad X"
        inCorrectSection = false
      }

      // Check for section header within correct priority
      if (inCorrectPriority && line.startsWith('### ')) {
        if (line.toLowerCase().includes(sectionName.toLowerCase())) {
          inCorrectSection = true
        } else if (inCorrectSection) {
          // We've moved past our section
          insertIndex = lastItemInSection !== -1 ? lastItemInSection + 1 : i
          break
        }
      }

      // Track last item in section
      if (inCorrectSection && (line.startsWith('- [') || line.startsWith('  -'))) {
        lastItemInSection = i
      }

      // Check for next priority or major section
      if (inCorrectSection && (line.startsWith('## ') || line.startsWith('---'))) {
        insertIndex = lastItemInSection !== -1 ? lastItemInSection + 1 : i
        break
      }
    }

    // If we didn't find an insert point, add at the end of the correct priority
    if (insertIndex === -1) {
      if (lastItemInSection !== -1) {
        insertIndex = lastItemInSection + 1
      } else {
        // Couldn't find section, return error with available sections
        return res.status(400).json({
          success: false,
          message: `Could not find section "${sectionName}" in Priority ${priority}. Please check the section name.`
        })
      }
    }

    // Insert the new item
    lines.splice(insertIndex, 0, newItem.trimEnd())
    const updatedContent = lines.join('\n')

    // Commit the changes via GitHub API
    const username = req.user?.username || 'system'
    const commitMessage = `feat(roadmap): Add "${title}" to P${priority} ${sectionName}\n\nAdded via TCGKB Dev Dashboard by ${username}`

    const updateResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/TODO.md`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(updatedContent).toString('base64'),
          sha: sha,
          branch: 'main'
        })
      }
    )

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}))
      log.error(MODULE, 'Failed to update TODO.md via GitHub API', errorData)
      return res.status(500).json({
        success: false,
        message: errorData.message || 'Failed to update TODO.md'
      })
    }

    const result = await updateResponse.json()

    // Invalidate cache
    roadmapCache = { data: null, timestamp: 0 }

    log.info(MODULE, `Roadmap item added: "${title}" to P${priority} ${section} by ${username}`)

    res.status(201).json({
      success: true,
      data: {
        title,
        priority,
        section,
        commitSha: result.commit?.sha,
        commitUrl: result.commit?.html_url
      },
      message: 'Item added to roadmap'
    })
  } catch (error) {
    log.error(MODULE, 'Add roadmap item failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add item to roadmap'
    })
  }
}

/**
 * Get available roadmap sections for dropdown
 */
export const getRoadmapSections = async (req, res) => {
  try {
    // Return static sections structure with key-value pairs for dropdown
    const priorities = {
      '1': {
        name: 'UX/UI',
        sections: [
          { key: 'navegacion-menu', name: 'Navegación / Menú' },
          { key: 'homepage-refresh', name: 'Homepage Refresh' },
          { key: 'smart-mentions', name: 'Smart Mentions System' },
          { key: 'avatares', name: 'Sistema de Avatares' },
          { key: 'relationship-map', name: 'Relationship Map' },
          { key: 'reprints', name: 'Sistema de Reprints' },
          { key: 'catalogo', name: 'Catálogo (/catalog)' },
          { key: 'binder', name: 'Binder / Colección Personal' },
          { key: 'fans-artistas', name: 'Sistema de Fans de Artistas' },
          { key: 'diseno-grafico', name: 'Overhaul de Diseño Gráfico' }
        ]
      },
      '2': {
        name: 'Funcionalidad',
        sections: [
          { key: 'decks', name: 'Decks' },
          { key: 'autenticacion', name: 'Autenticación / Usuario' },
          { key: 'ranking-hibrido', name: 'Ranking Híbrido de Popularidad' }
        ]
      },
      '3': {
        name: 'Backend / Infraestructura',
        sections: [
          { key: 'dev-dashboard', name: 'Dev Dashboard' },
          { key: 'bug-reporter', name: 'Bug Reporter - Integraciones' },
          { key: 'reputacion', name: 'Sistema de Reputación' }
        ]
      }
    }

    res.status(200).json({
      success: true,
      data: { priorities }
    })
  } catch (error) {
    log.error(MODULE, 'Get roadmap sections failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get roadmap sections'
    })
  }
}

/**
 * Get relationship map data - cards with comments and their connections
 */
export const getRelationshipMap = async (req, res) => {
  try {
    const now = Date.now()

    // Return cached data if still valid
    if (relationshipCache.data && (now - relationshipCache.timestamp) < RELATIONSHIP_CACHE_TTL) {
      log.info(MODULE, 'Relationship map returned from cache')
      return res.status(200).json({
        success: true,
        data: relationshipCache.data,
        cached: true
      })
    }

    // Get all cards that have comments (not moderated)
    const cardsWithComments = await Comment.aggregate([
      { $match: { isModerated: false, targetType: 'card', cardId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$cardId',
          commentCount: { $sum: 1 },
          mentions: { $push: '$cardMentions' }
        }
      }
    ])

    // Get unique card IDs
    const cardIds = cardsWithComments.map(c => c._id)

    // Fetch card details from cache - use cardId field, data is in 'data' object
    const cards = await CardCache.find({ cardId: { $in: cardIds } })
      .lean()

    // Create card lookup map
    const cardMap = {}
    cards.forEach(card => {
      cardMap[card.cardId] = {
        id: card.cardId,
        name: card.data?.name,
        image: card.data?.images?.small || card.data?.images?.large,
        tcgSystem: card.tcgSystem,
        set: card.data?.set?.name
      }
    })

    // Build nodes (cards with comments)
    const nodes = []
    const edges = []
    const edgeSet = new Set() // To avoid duplicate edges

    cardsWithComments.forEach(cardData => {
      const card = cardMap[cardData._id]
      if (!card) return

      nodes.push({
        id: card.id,
        name: card.name,
        image: card.image,
        tcgSystem: card.tcgSystem,
        set: card.set,
        commentCount: cardData.commentCount
      })

      // Process mentions to create edges
      cardData.mentions.forEach(mentionArray => {
        if (!mentionArray) return
        mentionArray.forEach(mention => {
          if (!mention || !mention.cardId) return

          // Create edge from this card to mentioned card
          const edgeKey = `${cardData._id}->${mention.cardId}`
          const reverseEdgeKey = `${mention.cardId}->${cardData._id}`

          // Skip self-references and duplicates
          if (cardData._id === mention.cardId) return
          if (edgeSet.has(edgeKey)) return

          edgeSet.add(edgeKey)
          edgeSet.add(reverseEdgeKey) // Mark reverse as visited too

          edges.push({
            source: cardData._id,
            target: mention.cardId,
            mentionType: mention.abilityType || 'card',
            abilityName: mention.abilityName
          })
        })
      })
    })

    // Add mentioned cards that aren't already in nodes (for complete graph)
    const mentionedCardIds = [...new Set(edges.flatMap(e => [e.source, e.target]))]
    const missingCardIds = mentionedCardIds.filter(id => !cardMap[id])

    if (missingCardIds.length > 0) {
      const missingCards = await CardCache.find({ cardId: { $in: missingCardIds } })
        .lean()

      missingCards.forEach(card => {
        nodes.push({
          id: card.cardId,
          name: card.data?.name,
          image: card.data?.images?.small || card.data?.images?.large,
          tcgSystem: card.tcgSystem,
          set: card.data?.set?.name,
          commentCount: 0
        })
      })
    }

    const result = {
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        cardsWithComments: cardsWithComments.length
      }
    }

    // Cache the result
    relationshipCache = {
      data: result,
      timestamp: now
    }

    log.info(MODULE, `Relationship map: ${nodes.length} nodes, ${edges.length} edges`)

    res.status(200).json({
      success: true,
      data: result,
      cached: false
    })
  } catch (error) {
    log.error(MODULE, 'Get relationship map failed', error)

    // Return cached data even if expired, as fallback
    if (relationshipCache.data) {
      return res.status(200).json({
        success: true,
        data: relationshipCache.data,
        cached: true,
        stale: true
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get relationship map'
    })
  }
}

/**
 * Get popularity statistics - aggregated data about card engagement
 * Returns: totals, averages, top performers, and distribution
 */
export const getPopularityStats = async (req, res) => {
  try {
    const { tcgSystem } = req.query

    // Get reaction totals by emoji
    const reactionTotals = await Reaction.aggregate([
      { $match: { targetType: 'card' } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } }
    ])

    const thumbsUp = reactionTotals.find(r => r._id === '👍')?.count || 0
    const thumbsDown = reactionTotals.find(r => r._id === '👎')?.count || 0

    // Get total comment count (non-moderated card comments)
    const totalComments = await Comment.countDocuments({
      targetType: 'card',
      isModerated: false
    })

    // Get total mentions count
    const mentionsResult = await Comment.aggregate([
      { $match: { isModerated: false, 'mentions.type': 'card' } },
      { $unwind: '$mentions' },
      { $match: { 'mentions.type': 'card' } },
      { $count: 'total' }
    ])
    const totalMentions = mentionsResult[0]?.total || 0

    // Get count of unique cards with engagement
    const cardsWithReactions = await Reaction.distinct('targetId', { targetType: 'card' })
    const cardsWithComments = await Comment.distinct('cardId', { targetType: 'card', isModerated: false })
    const cardsWithMentions = await Comment.aggregate([
      { $match: { isModerated: false, 'mentions.type': 'card' } },
      { $unwind: '$mentions' },
      { $match: { 'mentions.type': 'card' } },
      { $group: { _id: '$mentions.id' } }
    ])

    const uniqueCardsEngaged = new Set([
      ...cardsWithReactions,
      ...cardsWithComments,
      ...cardsWithMentions.map(m => m._id)
    ]).size

    // Get top 5 cards by each metric
    const topByThumbsUp = await Reaction.aggregate([
      { $match: { targetType: 'card', emoji: '👍' } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    const topByComments = await Comment.aggregate([
      { $match: { targetType: 'card', isModerated: false } },
      { $group: { _id: '$cardId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    const topByMentions = await Comment.aggregate([
      { $match: { isModerated: false, 'mentions.type': 'card' } },
      { $unwind: '$mentions' },
      { $match: { 'mentions.type': 'card' } },
      { $group: { _id: '$mentions.id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    // Calculate engagement distribution (how many cards have 1, 2, 3... reactions)
    const engagementDistribution = await Reaction.aggregate([
      { $match: { targetType: 'card' } },
      { $group: { _id: '$targetId', reactions: { $sum: 1 } } },
      {
        $bucket: {
          groupBy: '$reactions',
          boundaries: [1, 2, 5, 10, 20, 50, 100],
          default: '100+',
          output: { count: { $sum: 1 } }
        }
      }
    ])

    // Format distribution
    const distributionFormatted = engagementDistribution.reduce((acc, bucket) => {
      const key = bucket._id === '100+' ? '100+' : `${bucket._id}-${bucket._id === 50 ? 99 : bucket._id * 2 - 1}`
      acc[key] = bucket.count
      return acc
    }, {})

    // Get total cards for context
    let totalCardsQuery = {}
    if (tcgSystem) {
      totalCardsQuery.tcgSystem = tcgSystem
    }
    const totalCards = await CardCache.countDocuments(totalCardsQuery)

    // Calculate engagement rate
    const engagementRate = totalCards > 0
      ? ((uniqueCardsEngaged / totalCards) * 100).toFixed(2)
      : 0

    log.info(MODULE, `Popularity stats: ${uniqueCardsEngaged} engaged cards, ${thumbsUp + thumbsDown} reactions`)

    res.status(200).json({
      success: true,
      data: {
        totals: {
          thumbsUp,
          thumbsDown,
          netReactions: thumbsUp - thumbsDown,
          comments: totalComments,
          mentions: totalMentions,
          totalEngagements: thumbsUp + thumbsDown + totalComments + totalMentions
        },
        coverage: {
          totalCards,
          cardsWithEngagement: uniqueCardsEngaged,
          engagementRate: `${engagementRate}%`
        },
        topPerformers: {
          byThumbsUp: topByThumbsUp.map(t => ({ cardId: t._id, count: t.count })),
          byComments: topByComments.map(t => ({ cardId: t._id, count: t.count })),
          byMentions: topByMentions.map(t => ({ cardId: t._id, count: t.count }))
        },
        distribution: distributionFormatted
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get popularity stats failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get popularity statistics'
    })
  }
}

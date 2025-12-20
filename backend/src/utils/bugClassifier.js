/**
 * Bug Report Auto-Classification Utility
 * Analyzes bug reports to suggest priority, detect duplicates, and assign tags
 */

import BugReport from '../models/BugReport.js'

// Priority keywords - higher priority if these words appear
const PRIORITY_KEYWORDS = {
  critical: [
    'crash', 'crashes', 'crashing', 'broken', 'unusable', 'cannot access',
    'data loss', 'security', 'vulnerability', 'production down', 'blank page',
    'white screen', 'infinite loop', '500 error', 'server error', 'fatal'
  ],
  high: [
    'error', 'bug', 'fail', 'failed', 'failing', 'doesn\'t work', 'not working',
    'broken', 'wrong', 'incorrect', 'missing', 'disappeared', 'lost',
    'can\'t', 'cannot', 'unable', 'stuck', 'frozen', 'freeze'
  ],
  medium: [
    'issue', 'problem', 'sometimes', 'occasionally', 'slow', 'delay',
    'confusing', 'unexpected', 'strange', 'weird', 'glitch', 'inconsistent'
  ],
  low: [
    'suggestion', 'enhancement', 'improve', 'would be nice', 'feature request',
    'minor', 'cosmetic', 'typo', 'spelling', 'grammar', 'color', 'alignment'
  ]
}

// Page/component to label mapping
const PAGE_LABELS = {
  '/card/': 'area:card-detail',
  '/catalog': 'area:catalog',
  '/decks': 'area:decks',
  '/deck/': 'area:decks',
  '/artist': 'area:artists',
  '/login': 'area:auth',
  '/register': 'area:auth',
  '/settings': 'area:settings',
  '/mod': 'area:moderation',
  '/admin': 'area:admin',
  '/dev': 'area:dev-dashboard',
  '/roadmap': 'area:roadmap',
  '/relationship-map': 'area:relationship-map',
  '/user/': 'area:user-profile'
}

// Component keywords to labels
const COMPONENT_KEYWORDS = {
  'comment': 'component:comments',
  'mention': 'component:mentions',
  'reaction': 'component:reactions',
  'search': 'component:search',
  'filter': 'component:filters',
  'pagination': 'component:pagination',
  'modal': 'component:modal',
  'dropdown': 'component:dropdown',
  'avatar': 'component:avatar',
  'image': 'component:images',
  'loading': 'component:loading',
  'dark mode': 'component:theme',
  'theme': 'component:theme',
  'mobile': 'platform:mobile',
  'phone': 'platform:mobile',
  'tablet': 'platform:tablet',
  'safari': 'browser:safari',
  'firefox': 'browser:firefox',
  'chrome': 'browser:chrome',
  'edge': 'browser:edge'
}

/**
 * Calculate text similarity using Jaccard index
 */
function calculateSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3))

  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])

  return union.size > 0 ? intersection.size / union.size : 0
}

/**
 * Suggest priority based on description and title
 */
export function suggestPriority(title, description) {
  const text = `${title} ${description}`.toLowerCase()

  // Check for critical keywords
  for (const keyword of PRIORITY_KEYWORDS.critical) {
    if (text.includes(keyword)) {
      return { priority: 'critical', confidence: 0.9, matchedKeyword: keyword }
    }
  }

  // Check for high priority keywords
  for (const keyword of PRIORITY_KEYWORDS.high) {
    if (text.includes(keyword)) {
      return { priority: 'high', confidence: 0.8, matchedKeyword: keyword }
    }
  }

  // Check for low priority keywords (feature requests, minor issues)
  for (const keyword of PRIORITY_KEYWORDS.low) {
    if (text.includes(keyword)) {
      return { priority: 'low', confidence: 0.7, matchedKeyword: keyword }
    }
  }

  // Check for medium priority keywords
  for (const keyword of PRIORITY_KEYWORDS.medium) {
    if (text.includes(keyword)) {
      return { priority: 'medium', confidence: 0.6, matchedKeyword: keyword }
    }
  }

  // Default to medium if no keywords matched
  return { priority: 'medium', confidence: 0.5, matchedKeyword: null }
}

/**
 * Suggest labels based on page URL and description
 */
export function suggestLabels(pageUrl, title, description) {
  const labels = ['bug', 'from-app'] // Base labels
  const text = `${title} ${description}`.toLowerCase()

  // Check page URL for area labels
  if (pageUrl) {
    for (const [pattern, label] of Object.entries(PAGE_LABELS)) {
      if (pageUrl.includes(pattern)) {
        labels.push(label)
        break // Only add one area label
      }
    }
  }

  // Check text for component keywords
  for (const [keyword, label] of Object.entries(COMPONENT_KEYWORDS)) {
    if (text.includes(keyword) && !labels.includes(label)) {
      labels.push(label)
    }
  }

  return labels
}

/**
 * Find potential duplicate bugs
 */
export async function findPotentialDuplicates(title, description, limit = 5) {
  try {
    // Get recent open bugs
    const recentBugs = await BugReport.find({
      status: { $in: ['new', 'reviewing', 'in_progress'] }
    })
      .select('title description githubIssueNumber githubIssueUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    if (recentBugs.length === 0) {
      return []
    }

    const newText = `${title} ${description}`
    const duplicates = []

    for (const bug of recentBugs) {
      const existingText = `${bug.title} ${bug.description}`
      const similarity = calculateSimilarity(newText, existingText)

      // If similarity is above 40%, consider it a potential duplicate
      if (similarity >= 0.4) {
        duplicates.push({
          id: bug._id,
          title: bug.title,
          similarity: Math.round(similarity * 100),
          githubIssueNumber: bug.githubIssueNumber,
          githubIssueUrl: bug.githubIssueUrl,
          createdAt: bug.createdAt
        })
      }
    }

    // Sort by similarity and return top matches
    return duplicates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  } catch (error) {
    console.error('Error finding duplicates:', error)
    return []
  }
}

/**
 * Full classification of a bug report
 */
export async function classifyBug(title, description, pageUrl = '') {
  const prioritySuggestion = suggestPriority(title, description)
  const suggestedLabels = suggestLabels(pageUrl, title, description)
  const potentialDuplicates = await findPotentialDuplicates(title, description)

  return {
    priority: prioritySuggestion,
    labels: suggestedLabels,
    potentialDuplicates,
    hasPotentialDuplicates: potentialDuplicates.length > 0
  }
}

export default {
  suggestPriority,
  suggestLabels,
  findPotentialDuplicates,
  classifyBug
}

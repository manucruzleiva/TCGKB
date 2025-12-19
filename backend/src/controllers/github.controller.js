import log from '../utils/logger.js'
import BugReport from '../models/BugReport.js'
import { classifyBug, suggestPriority, suggestLabels, findPotentialDuplicates } from '../utils/bugClassifier.js'
import reputationService from '../services/reputation.service.js'

const MODULE = 'GitHubController'

// GitHub repository configuration
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'manucruzleiva'
const GITHUB_REPO = process.env.GITHUB_REPO || 'TCGKB'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

/**
 * Create a GitHub issue
 */
export const createIssue = async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      log.error(MODULE, 'GITHUB_TOKEN not configured')
      return res.status(500).json({
        success: false,
        message: 'GitHub integration not configured'
      })
    }

    const { title, description, screenshot, pageUrl, userAgent, theme, language, screenSize } = req.body

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      })
    }

    // Build the issue body with context
    const username = req.user?.username || 'Anonymous'
    const userEmail = req.user?.email || 'N/A'

    let body = `## Bug Report\n\n`
    body += `**Reported by:** ${username} (${userEmail})\n`
    body += `**Page:** ${pageUrl || 'N/A'}\n`
    body += `**Theme:** ${theme || 'N/A'}\n`
    body += `**Language:** ${language || 'N/A'}\n`
    body += `**Screen Size:** ${screenSize || 'N/A'}\n\n`
    body += `---\n\n`
    body += `### Description\n\n${description}\n\n`

    if (userAgent) {
      body += `---\n\n`
      body += `### Browser Info\n\n\`\`\`\n${userAgent}\n\`\`\`\n\n`
    }

    // If there's a screenshot, we'll upload it to the issue
    // Note: GitHub doesn't accept base64 directly in issue body,
    // so we'll include a note about the screenshot being captured
    if (screenshot) {
      body += `---\n\n`
      body += `### Screenshot\n\n`
      body += `*Screenshot was captured at the time of report.*\n\n`
      // For now, we'll include a small marker - in production, you'd upload to a CDN
      // or use GitHub's attachment API
    }

    body += `---\n*Submitted via TCGKB Bug Reporter*`

    // Auto-classify the bug
    const classification = await classifyBug(title, description, pageUrl)
    const autoLabels = suggestLabels(pageUrl, title, description)

    // Add classification info to body
    body += `\n\n---\n### Auto-Classification\n`
    body += `**Suggested Priority:** ${classification.priority.priority} (confidence: ${Math.round(classification.priority.confidence * 100)}%)`
    if (classification.priority.matchedKeyword) {
      body += ` - matched: "${classification.priority.matchedKeyword}"`
    }
    body += `\n**Auto Labels:** ${autoLabels.join(', ')}\n`

    if (classification.hasPotentialDuplicates) {
      body += `\n**Potential Duplicates:**\n`
      classification.potentialDuplicates.forEach(dup => {
        body += `- #${dup.githubIssueNumber || 'N/A'}: ${dup.title} (${dup.similarity}% similar)\n`
      })
    }

    // Create the issue via GitHub API with auto-generated labels
    const issueData = {
      title: `[Bug] ${title}`,
      body,
      labels: autoLabels
    }

    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(issueData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      log.error(MODULE, `GitHub API error: ${response.status}`, {
        error: errorData,
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        tokenConfigured: !!GITHUB_TOKEN
      })
      return res.status(response.status).json({
        success: false,
        message: errorData.message || `GitHub API error: ${response.status}`
      })
    }

    const issue = await response.json()

    log.info(MODULE, `GitHub issue created: #${issue.number} - ${title}`)

    // Save bug report to database with GitHub issue reference and auto-classification
    try {
      const bugReport = await BugReport.create({
        title: title.trim(),
        description: description.trim(),
        screenshot: screenshot || null,
        pageUrl: pageUrl || '',
        userAgent: userAgent || '',
        theme: theme || 'light',
        language: language || 'en',
        screenSize: screenSize || '',
        userId: req.user?._id || null,
        status: 'new',
        priority: classification.priority.priority, // Use auto-suggested priority
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.html_url,
        githubIssueState: issue.state
      })
      log.info(MODULE, `Bug report saved to database with GitHub issue #${issue.number}, auto-priority: ${classification.priority.priority}`)

      // Award reputation points for reporting a bug (only for authenticated users)
      if (req.user?._id) {
        try {
          await reputationService.awardPoints({
            userId: req.user._id,
            actionType: 'bug_reported',
            sourceType: 'bug_report',
            sourceId: bugReport._id,
            description: `Reported bug: ${title.substring(0, 50)}`
          })
          log.info(MODULE, `Reputation awarded for bug report to user ${req.user._id}`)
        } catch (repError) {
          log.error(MODULE, 'Failed to award reputation for bug report', repError)
        }
      }
    } catch (dbError) {
      // Log but don't fail - GitHub issue was created successfully
      log.error(MODULE, 'Failed to save bug report to database', dbError)
    }

    res.status(201).json({
      success: true,
      data: {
        number: issue.number,
        url: issue.html_url,
        title: issue.title,
        state: issue.state
      },
      message: 'Bug report submitted to GitHub'
    })
  } catch (error) {
    log.error(MODULE, 'Create GitHub issue failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create GitHub issue'
    })
  }
}

/**
 * Get GitHub issues (for dashboard)
 */
export const getIssues = async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      log.error(MODULE, 'GITHUB_TOKEN not configured')
      return res.status(500).json({
        success: false,
        message: 'GitHub integration not configured'
      })
    }

    const { state = 'all', labels, page = 1, per_page = 30, sort = 'created', direction = 'desc' } = req.query

    // Fetch issues from GitHub API
    const params = new URLSearchParams({
      state,
      page: String(page),
      per_page: String(per_page),
      sort,
      direction
    })

    // Only add labels filter if provided
    if (labels) {
      params.append('labels', labels)
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?${params}`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      log.error(MODULE, `GitHub API error: ${response.status}`, errorData)
      return res.status(response.status).json({
        success: false,
        message: errorData.message || 'Failed to fetch GitHub issues'
      })
    }

    const issues = await response.json()

    // Filter out pull requests (GitHub API returns PRs as issues too)
    const bugIssues = issues.filter(issue => !issue.pull_request)

    // Get total count from headers if available
    const linkHeader = response.headers.get('Link')
    let totalPages = 1
    if (linkHeader) {
      const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/)
      if (lastMatch) {
        totalPages = parseInt(lastMatch[1])
      }
    }

    // Calculate counts
    const openCount = bugIssues.filter(i => i.state === 'open').length
    const closedCount = bugIssues.filter(i => i.state === 'closed').length

    // Map to simpler format
    const mappedIssues = bugIssues.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title.replace(/^\[Bug\]\s*/i, ''),
      body: issue.body,
      state: issue.state,
      labels: issue.labels.map(l => ({ name: l.name, color: l.color })),
      user: {
        login: issue.user.login,
        avatar_url: issue.user.avatar_url
      },
      assignees: issue.assignees.map(a => ({
        login: a.login,
        avatar_url: a.avatar_url
      })),
      comments: issue.comments,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
      html_url: issue.html_url
    }))

    res.status(200).json({
      success: true,
      data: {
        issues: mappedIssues,
        pagination: {
          page: parseInt(page),
          per_page: parseInt(per_page),
          total_pages: totalPages
        },
        counts: {
          total: mappedIssues.length,
          open: openCount,
          closed: closedCount
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get GitHub issues failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GitHub issues'
    })
  }
}

/**
 * Get GitHub issue statistics
 */
export const getIssueStats = async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'GitHub integration not configured'
      })
    }

    // Fetch open issues count (all issues, not filtered by label)
    const openResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&per_page=1`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    // Fetch closed issues count
    const closedResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=closed&per_page=1`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    // Get counts from Link headers
    const getCountFromHeader = (response) => {
      const linkHeader = response.headers.get('Link')
      if (linkHeader) {
        const lastMatch = linkHeader.match(/page=(\d+)&per_page=1>; rel="last"/)
        if (lastMatch) {
          return parseInt(lastMatch[1])
        }
      }
      // If no Link header, check if there's data
      return 0
    }

    let openCount = 0
    let closedCount = 0

    if (openResponse.ok) {
      const openData = await openResponse.json()
      openCount = openData.length > 0 ? getCountFromHeader(openResponse) || openData.length : 0
    }

    if (closedResponse.ok) {
      const closedData = await closedResponse.json()
      closedCount = closedData.length > 0 ? getCountFromHeader(closedResponse) || closedData.length : 0
    }

    // Get recent issues for time series (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const since = thirtyDaysAgo.toISOString()

    const recentResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&since=${since}&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    let timeSeries = []
    if (recentResponse.ok) {
      const recentIssues = await recentResponse.json()
      const bugIssues = recentIssues.filter(i => !i.pull_request)

      // Group by date
      const dateMap = {}
      bugIssues.forEach(issue => {
        const createdDate = issue.created_at.split('T')[0]
        if (!dateMap[createdDate]) {
          dateMap[createdDate] = { created: 0, closed: 0 }
        }
        dateMap[createdDate].created++

        if (issue.closed_at) {
          const closedDate = issue.closed_at.split('T')[0]
          if (!dateMap[closedDate]) {
            dateMap[closedDate] = { created: 0, closed: 0 }
          }
          dateMap[closedDate].closed++
        }
      })

      timeSeries = Object.entries(dateMap)
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    res.status(200).json({
      success: true,
      data: {
        counts: {
          total: openCount + closedCount,
          open: openCount,
          closed: closedCount
        },
        timeSeries,
        repository: {
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues`
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get GitHub issue stats failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issue statistics'
    })
  }
}

/**
 * Add comment to a GitHub issue
 */
export const addComment = async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'GitHub integration not configured'
      })
    }

    const { issueNumber } = req.params
    const { comment } = req.body

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      })
    }

    const username = req.user?.username || 'Admin'
    const body = `**Comment by ${username}:**\n\n${comment}`

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        success: false,
        message: errorData.message || 'Failed to add comment'
      })
    }

    const commentData = await response.json()

    log.info(MODULE, `Comment added to issue #${issueNumber}`)

    res.status(201).json({
      success: true,
      data: {
        id: commentData.id,
        body: commentData.body,
        created_at: commentData.created_at
      },
      message: 'Comment added'
    })
  } catch (error) {
    log.error(MODULE, 'Add comment failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    })
  }
}

/**
 * Close or reopen a GitHub issue
 */
export const updateIssueState = async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'GitHub integration not configured'
      })
    }

    const { issueNumber } = req.params
    const { state } = req.body

    if (!['open', 'closed'].includes(state)) {
      return res.status(400).json({
        success: false,
        message: 'State must be "open" or "closed"'
      })
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return res.status(response.status).json({
        success: false,
        message: errorData.message || 'Failed to update issue'
      })
    }

    const issue = await response.json()

    log.info(MODULE, `Issue #${issueNumber} state changed to ${state}`)

    // Sync bug report status with GitHub issue state
    try {
      const updateData = {
        githubIssueState: issue.state
      }

      // If issue is closed, update bug report status
      if (issue.state === 'closed') {
        updateData.status = 'resolved'
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = req.user?._id || null
      } else if (issue.state === 'open') {
        // If reopened, set back to in_progress
        updateData.status = 'in_progress'
        updateData.resolvedAt = null
        updateData.resolvedBy = null
      }

      const bugReport = await BugReport.findOneAndUpdate(
        { githubIssueNumber: parseInt(issueNumber) },
        updateData,
        { new: true }
      )
      log.info(MODULE, `Bug report synced with GitHub issue #${issueNumber} state: ${state}`)

      // Award reputation to the bug reporter when their bug is resolved
      if (issue.state === 'closed' && bugReport?.userId) {
        try {
          await reputationService.awardPoints({
            userId: bugReport.userId,
            actionType: 'bug_processed',
            sourceType: 'bug_report',
            sourceId: bugReport._id,
            triggeredBy: req.user?._id,
            description: `Bug report resolved: #${issueNumber}`
          })
          log.info(MODULE, `Reputation awarded for bug processed to user ${bugReport.userId}`)
        } catch (repError) {
          log.error(MODULE, 'Failed to award reputation for bug processed', repError)
        }
      }
    } catch (syncError) {
      log.error(MODULE, `Failed to sync bug report with GitHub issue #${issueNumber}`, syncError)
    }

    res.status(200).json({
      success: true,
      data: {
        number: issue.number,
        state: issue.state,
        updated_at: issue.updated_at
      },
      message: `Issue ${state === 'closed' ? 'closed' : 'reopened'}`
    })
  } catch (error) {
    log.error(MODULE, 'Update issue state failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update issue'
    })
  }
}

/**
 * Check if GitHub integration is configured
 */
export const checkConfig = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      configured: !!GITHUB_TOKEN,
      repository: GITHUB_TOKEN ? {
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
      } : null
    }
  })
}

/**
 * Get commits from GitHub (for changelog)
 * Fetches commits from stage and main branches to show what's in development vs production
 */
export const getCommits = async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'GitHub integration not configured'
      })
    }

    const { branch = 'stage', page = 1, per_page = 30, since } = req.query

    // Build query params
    const params = new URLSearchParams({
      sha: branch,
      page: String(page),
      per_page: String(per_page)
    })

    if (since) {
      params.append('since', since)
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?${params}`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      log.error(MODULE, `GitHub API error fetching commits: ${response.status}`, errorData)
      return res.status(response.status).json({
        success: false,
        message: errorData.message || 'Failed to fetch commits'
      })
    }

    const commits = await response.json()

    // Parse commit type from conventional commit format
    const parseCommitType = (message) => {
      const match = message.match(/^(feat|fix|refactor|docs|style|test|chore|perf|ci|build|revert)(\(.+?\))?:\s*/i)
      if (match) {
        return {
          type: match[1].toLowerCase(),
          scope: match[2] ? match[2].replace(/[()]/g, '') : null,
          message: message.replace(match[0], '').split('\n')[0]
        }
      }
      // Check for merge commits
      if (message.startsWith('Merge')) {
        return { type: 'merge', scope: null, message: message.split('\n')[0] }
      }
      // Auto-merge commits
      if (message.includes('Auto-merge')) {
        return { type: 'auto-merge', scope: null, message: message.split('\n')[0] }
      }
      return { type: 'other', scope: null, message: message.split('\n')[0] }
    }

    // Map commits to simpler format
    const mappedCommits = commits.map(commit => {
      const parsed = parseCommitType(commit.commit.message)
      return {
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        type: parsed.type,
        scope: parsed.scope,
        message: parsed.message,
        fullMessage: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
          avatar_url: commit.author?.avatar_url || null,
          login: commit.author?.login || null
        },
        url: commit.html_url,
        stats: commit.stats || null
      }
    })

    // Get pagination info from Link header
    const linkHeader = response.headers.get('Link')
    let totalPages = parseInt(page)
    if (linkHeader) {
      const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/)
      if (lastMatch) {
        totalPages = parseInt(lastMatch[1])
      }
    }

    // Group commits by date for easier display
    const groupedByDate = {}
    mappedCommits.forEach(commit => {
      const date = commit.author.date.split('T')[0]
      if (!groupedByDate[date]) {
        groupedByDate[date] = []
      }
      groupedByDate[date].push(commit)
    })

    res.status(200).json({
      success: true,
      data: {
        commits: mappedCommits,
        groupedByDate,
        branch,
        pagination: {
          page: parseInt(page),
          per_page: parseInt(per_page),
          total_pages: totalPages,
          has_more: mappedCommits.length === parseInt(per_page)
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get commits failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commits'
    })
  }
}

/**
 * Get changelog - commits in stage not yet in main (upcoming features)
 * and recent commits in main (released features)
 */
export const getChangelog = async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'GitHub integration not configured'
      })
    }

    const headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }

    // Fetch recent commits from main (production)
    const mainResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?sha=main&per_page=50`,
      { headers }
    )

    // Fetch recent commits from stage (staging)
    const stageResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?sha=stage&per_page=50`,
      { headers }
    )

    let mainCommits = []
    let stageCommits = []
    let pendingCommits = []

    if (mainResponse.ok) {
      mainCommits = await mainResponse.json()
    }

    if (stageResponse.ok) {
      stageCommits = await stageResponse.json()
    }

    // Find commits in stage that are not in main (pending deployment)
    const mainShas = new Set(mainCommits.map(c => c.sha))
    pendingCommits = stageCommits.filter(c => !mainShas.has(c.sha))

    // Parse commit info
    const parseCommit = (commit) => {
      const message = commit.commit.message
      const match = message.match(/^(feat|fix|refactor|docs|style|test|chore|perf|ci|build|revert)(\(.+?\))?:\s*/i)

      let type = 'other'
      let scope = null
      let cleanMessage = message.split('\n')[0]

      if (match) {
        type = match[1].toLowerCase()
        scope = match[2] ? match[2].replace(/[()]/g, '') : null
        cleanMessage = message.replace(match[0], '').split('\n')[0]
      } else if (message.startsWith('Merge')) {
        type = 'merge'
      } else if (message.includes('Auto-merge')) {
        type = 'auto-merge'
      }

      return {
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        type,
        scope,
        message: cleanMessage,
        author: {
          name: commit.commit.author.name,
          date: commit.commit.author.date,
          avatar_url: commit.author?.avatar_url || null,
          login: commit.author?.login || null
        },
        url: commit.html_url
      }
    }

    // Filter out merge/auto-merge commits for cleaner changelog
    const filterMergeCommits = (commits) =>
      commits.filter(c => !['merge', 'auto-merge'].includes(c.type))

    const parsedMainCommits = mainCommits.map(parseCommit)
    const parsedPendingCommits = pendingCommits.map(parseCommit)

    // Group by type for better organization
    const groupByType = (commits) => {
      const groups = {
        feat: [],
        fix: [],
        refactor: [],
        perf: [],
        docs: [],
        other: []
      }

      commits.forEach(commit => {
        if (groups[commit.type]) {
          groups[commit.type].push(commit)
        } else {
          groups.other.push(commit)
        }
      })

      return groups
    }

    res.status(200).json({
      success: true,
      data: {
        pending: {
          commits: filterMergeCommits(parsedPendingCommits),
          byType: groupByType(filterMergeCommits(parsedPendingCommits)),
          count: filterMergeCommits(parsedPendingCommits).length
        },
        released: {
          commits: filterMergeCommits(parsedMainCommits).slice(0, 30),
          byType: groupByType(filterMergeCommits(parsedMainCommits).slice(0, 30)),
          count: filterMergeCommits(parsedMainCommits).length
        },
        repository: {
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get changelog failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch changelog'
    })
  }
}

/**
 * Get bug classification suggestions before submitting
 * Analyzes title and description to suggest priority, labels, and detect duplicates
 */
export const classifyBugReport = async (req, res) => {
  try {
    const { title, description, pageUrl } = req.body

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      })
    }

    // Get full classification
    const classification = await classifyBug(title, description, pageUrl || '')

    res.status(200).json({
      success: true,
      data: {
        priority: {
          suggested: classification.priority.priority,
          confidence: classification.priority.confidence,
          matchedKeyword: classification.priority.matchedKeyword
        },
        labels: classification.labels,
        potentialDuplicates: classification.potentialDuplicates,
        hasPotentialDuplicates: classification.hasPotentialDuplicates
      }
    })
  } catch (error) {
    log.error(MODULE, 'Classify bug report failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to classify bug report'
    })
  }
}

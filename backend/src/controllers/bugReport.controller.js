import BugReport from '../models/BugReport.js'
import User from '../models/User.js'
import log from '../utils/logger.js'

const MODULE = 'BugReportController'

/**
 * Create a new bug report
 */
export const createBugReport = async (req, res) => {
  try {
    const { title, description, screenshot, pageUrl, userAgent } = req.body

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      })
    }

    const bugReport = new BugReport({
      title,
      description,
      screenshot: screenshot || null,
      pageUrl: pageUrl || '',
      userAgent: userAgent || '',
      userId: req.user?._id || null
    })

    await bugReport.save()

    log.info(MODULE, `Bug report created: ${title}`)

    res.status(201).json({
      success: true,
      data: bugReport,
      message: 'Bug report submitted successfully'
    })
  } catch (error) {
    log.error(MODULE, 'Create bug report failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit bug report'
    })
  }
}

/**
 * Get all bug reports (admin only)
 */
export const getAllBugReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    const query = {}
    if (status && status !== 'all') {
      query.status = status
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [bugReports, total] = await Promise.all([
      BugReport.find(query)
        .populate('userId', 'username email')
        .populate('resolvedBy', 'username')
        .populate('assignedTo', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      BugReport.countDocuments(query)
    ])

    // Get counts by status
    const statusCounts = await BugReport.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const counts = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // Calculate totals
    const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0)
    const openStatuses = ['new', 'reviewing', 'in_progress']
    const closedStatuses = ['resolved', 'wont_fix']

    counts.total = totalCount
    counts.open = openStatuses.reduce((sum, status) => sum + (counts[status] || 0), 0)
    counts.closed = closedStatuses.reduce((sum, status) => sum + (counts[status] || 0), 0)

    // Get time-based data for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const timeSeriesData = await BugReport.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          created: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['resolved', 'wont_fix']] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])

    // Format time series for frontend
    const timeSeries = timeSeriesData.map(item => ({
      date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
      created: item.created,
      resolved: item.resolved
    }))

    // Handle filter by open/closed
    let filteredReports = bugReports
    if (status === 'open') {
      filteredReports = await BugReport.find({ status: { $in: openStatuses } })
        .populate('userId', 'username email')
        .populate('resolvedBy', 'username')
        .sort({ createdAt: -1 })
        .lean()
    } else if (status === 'closed') {
      filteredReports = await BugReport.find({ status: { $in: closedStatuses } })
        .populate('userId', 'username email')
        .populate('resolvedBy', 'username')
        .sort({ createdAt: -1 })
        .lean()
    }

    res.status(200).json({
      success: true,
      data: {
        bugReports: filteredReports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        counts,
        timeSeries
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get bug reports failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get bug reports'
    })
  }
}

/**
 * Update bug report status (admin only)
 */
export const updateBugReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params
    const { status, priority, adminNotes } = req.body

    const bugReport = await BugReport.findById(reportId)

    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      })
    }

    // Update fields
    if (status) {
      bugReport.status = status
      if (status === 'resolved' || status === 'wont_fix') {
        bugReport.resolvedAt = new Date()
        bugReport.resolvedBy = req.user._id
      }
    }

    if (priority) {
      bugReport.priority = priority
    }

    if (adminNotes !== undefined) {
      bugReport.adminNotes = adminNotes
    }

    // Handle assignment
    const { assignedTo } = req.body
    if (assignedTo !== undefined) {
      bugReport.assignedTo = assignedTo || null
    }

    await bugReport.save()

    // Populate for response
    await bugReport.populate('assignedTo', 'username')

    log.info(MODULE, `Bug report ${reportId} updated by ${req.user.username}`)

    res.status(200).json({
      success: true,
      data: bugReport,
      message: 'Bug report updated'
    })
  } catch (error) {
    log.error(MODULE, 'Update bug report failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update bug report'
    })
  }
}

/**
 * Get available assignees (admins and devs)
 */
export const getAvailableAssignees = async (req, res) => {
  try {
    const DEV_EMAILS = ['shieromanu@gmail.com']

    // Find admins and devs
    const assignees = await User.find({
      $or: [
        { role: 'admin' },
        { isDev: true },
        { email: { $in: DEV_EMAILS } }
      ],
      isActive: true
    }).select('_id username email role isDev').lean()

    // Add isDev flag for hardcoded emails
    const assigneesWithDev = assignees.map(user => ({
      ...user,
      isDev: user.isDev || DEV_EMAILS.includes(user.email)
    }))

    res.status(200).json({
      success: true,
      data: assigneesWithDev
    })
  } catch (error) {
    log.error(MODULE, 'Get assignees failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get assignees'
    })
  }
}

/**
 * Delete bug report (admin only)
 */
export const deleteBugReport = async (req, res) => {
  try {
    const { reportId } = req.params

    const bugReport = await BugReport.findByIdAndDelete(reportId)

    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      })
    }

    log.info(MODULE, `Bug report ${reportId} deleted`)

    res.status(200).json({
      success: true,
      message: 'Bug report deleted'
    })
  } catch (error) {
    log.error(MODULE, 'Delete bug report failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete bug report'
    })
  }
}

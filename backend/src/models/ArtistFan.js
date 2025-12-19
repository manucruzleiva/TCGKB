import mongoose from 'mongoose'

const artistFanSchema = new mongoose.Schema({
  artistName: {
    type: String,
    required: [true, 'Artist name is required'],
    trim: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  }
}, {
  timestamps: true
})

// Compound index for unique user-artist combination
artistFanSchema.index({ artistName: 1, userId: 1 }, { unique: true })

// Static method to get fan count for an artist
artistFanSchema.statics.getFanCount = async function(artistName) {
  return this.countDocuments({ artistName })
}

// Static method to check if user is a fan
artistFanSchema.statics.isFan = async function(artistName, userId) {
  const exists = await this.findOne({ artistName, userId })
  return !!exists
}

// Static method to get top artists by fan count
artistFanSchema.statics.getTopArtists = async function(limit = 20) {
  return this.aggregate([
    { $group: { _id: '$artistName', fanCount: { $sum: 1 } } },
    { $sort: { fanCount: -1 } },
    { $limit: limit },
    { $project: { artistName: '$_id', fanCount: 1, _id: 0 } }
  ])
}

const ArtistFan = mongoose.model('ArtistFan', artistFanSchema)

export default ArtistFan

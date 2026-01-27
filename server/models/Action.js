import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Action title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  context: {
    type: String,
    enum: ['@phone', '@computer', '@office', '@errands', '@home', '@anywhere', '@waiting'],
    default: '@anywhere'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  deadline: {
    type: Date,
    default: null
  },
  estimatedMinutes: {
    type: Number,
    default: null
  },
  isQuickAction: {
    type: Boolean,
    default: false // True if <= 2 minutes (2-minute rule)
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'waiting', 'deferred'],
    default: 'active'
  },
  waitingFor: {
    type: String,
    trim: true,
    default: null // Who/what are we waiting for
  },
  waitingForDate: {
    type: Date,
    default: null // When did we start waiting
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3 // 1 = highest, 5 = lowest
  },
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  completedAt: {
    type: Date,
    default: null
  },
  pointsAwarded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient filtering and searching
actionSchema.index({ status: 1, deadline: 1 });
actionSchema.index({ context: 1, status: 1 });
actionSchema.index({ keywords: 1 });
actionSchema.index({ project: 1 });

// Virtual to check if action is overdue
actionSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return new Date() > this.deadline && this.status === 'active';
});

// Pre-save middleware to set isQuickAction
actionSchema.pre('save', function(next) {
  if (this.estimatedMinutes !== null && this.estimatedMinutes <= 2) {
    this.isQuickAction = true;
  }
  next();
});

// Ensure virtuals are included in JSON
actionSchema.set('toJSON', { virtuals: true });
actionSchema.set('toObject', { virtuals: true });

export default mongoose.model('Action', actionSchema);

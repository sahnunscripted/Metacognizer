import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  purpose: {
    type: String,
    trim: true,
    default: '' // Why are we doing this?
  },
  desiredOutcome: {
    type: String,
    trim: true,
    default: '' // What does success look like?
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'onHold', 'someday'],
    default: 'active'
  },
  deadline: {
    type: Date,
    default: null
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  category: {
    type: String,
    trim: true,
    default: 'general' // work, personal, health, finance, etc.
  },
  completedAt: {
    type: Date,
    default: null
  },
  totalPointsAwarded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to get all actions for this project
projectSchema.virtual('actions', {
  ref: 'Action',
  localField: '_id',
  foreignField: 'project'
});

// Virtual to calculate progress
projectSchema.virtual('progress').get(function() {
  // This will be populated when we query with actions
  if (!this.actions || this.actions.length === 0) return 0;
  const completed = this.actions.filter(a => a.status === 'completed').length;
  return Math.round((completed / this.actions.length) * 100);
});

// Virtual to get next action
projectSchema.virtual('nextAction').get(function() {
  if (!this.actions) return null;
  const activeActions = this.actions
    .filter(a => a.status === 'active')
    .sort((a, b) => {
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return a.priority - b.priority;
    });
  return activeActions[0] || null;
});

projectSchema.index({ status: 1 });
projectSchema.index({ category: 1 });

export default mongoose.model('Project', projectSchema);

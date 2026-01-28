import mongoose from 'mongoose';

const recurringActionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Recurring action title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  context: {
    type: String,
    enum: ['@phone', '@computer', '@office', '@errands', '@home', '@anywhere', '@waiting', '@beanetics', '@cafe'],
    default: '@anywhere'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  estimatedMinutes: {
    type: Number,
    default: null
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6
  }],
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'expired'],
    default: 'active'
  },
  lastGeneratedDate: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

recurringActionSchema.index({ status: 1, daysOfWeek: 1 });
recurringActionSchema.index({ endDate: 1 });

recurringActionSchema.set('toJSON', { virtuals: true });
recurringActionSchema.set('toObject', { virtuals: true });

export default mongoose.model('RecurringAction', recurringActionSchema);

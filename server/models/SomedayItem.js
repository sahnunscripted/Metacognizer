import mongoose from 'mongoose';

const somedayItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['someday', 'maybe', 'idea', 'book', 'movie', 'skill', 'travel', 'hobby', 'other'],
    default: 'someday'
  },
  // Is this a committed future project or just an interest?
  commitment: {
    type: String,
    enum: ['committed', 'interested', 'curious'],
    default: 'interested'
  },
  lastReviewedAt: {
    type: Date,
    default: null
  },
  // If activated, where did it go?
  activatedTo: {
    type: {
      type: String,
      enum: ['project', 'action'],
      default: null
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  activatedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'activated', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

somedayItemSchema.index({ status: 1 });
somedayItemSchema.index({ category: 1 });
somedayItemSchema.index({ lastReviewedAt: 1 });

export default mongoose.model('SomedayItem', somedayItemSchema);

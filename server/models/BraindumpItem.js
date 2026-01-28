import mongoose from 'mongoose';

const braindumpItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['uncategorized', 'work', 'personal', 'toBuy', 'email', 'someday', 'squirrel'],
    default: 'uncategorized'
  },
  actionType: {
    type: String,
    enum: ['unprocessed', 'doNow', 'schedule', 'delegate', 'delete', 'reference'],
    default: 'unprocessed'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low', 'none'],
    default: 'none' // For 1-3-5 rule: high = top 1, medium = next 3, low = remaining 5
  },
  processedAt: {
    type: Date,
    default: null
  },
  // Where did this item end up after processing?
  convertedTo: {
    type: {
      type: String,
      enum: ['action', 'project', 'someday', 'inbasket', 'deleted'],
      default: null
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

braindumpItemSchema.index({ actionType: 1 });
braindumpItemSchema.index({ category: 1 });
braindumpItemSchema.index({ createdAt: -1 });

export default mongoose.model('BraindumpItem', braindumpItemSchema);

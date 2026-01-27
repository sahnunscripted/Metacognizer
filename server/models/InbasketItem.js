import mongoose from 'mongoose';

const inbasketItemSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  source: {
    type: String,
    enum: ['email', 'voicemail', 'note', 'document', 'meeting', 'idea', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['unprocessed', 'processed'],
    default: 'unprocessed'
  },
  // Processing decision
  decision: {
    type: String,
    enum: ['none', 'trash', 'delegate', 'defer', 'doNow', 'reference'],
    default: 'none'
  },
  // If delegated
  delegatedTo: {
    type: String,
    trim: true,
    default: null
  },
  // If deferred - where did it go?
  deferredTo: {
    type: {
      type: String,
      enum: ['action', 'project', 'calendar', 'someday'],
      default: null
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    date: {
      type: Date,
      default: null
    }
  },
  // Reference file location if saved for reference
  referenceLocation: {
    type: String,
    trim: true,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

inbasketItemSchema.index({ status: 1 });
inbasketItemSchema.index({ createdAt: -1 });

export default mongoose.model('InbasketItem', inbasketItemSchema);

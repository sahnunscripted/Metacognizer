import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  // Daily activity tracking
  dailyActivity: [{
    date: {
      type: Date,
      required: true
    },
    actionsCompleted: {
      type: Number,
      default: 0
    },
    pointsEarned: {
      type: Number,
      default: 0
    },
    braindumpsProcessed: {
      type: Number,
      default: 0
    },
    inbasketCleared: {
      type: Number,
      default: 0
    }
  }],
  // Achievement/milestone tracking
  achievements: [{
    type: {
      type: String,
      enum: [
        'firstAction',
        'streak3',
        'streak7',
        'streak30',
        'points100',
        'points500',
        'points1000',
        'projectComplete',
        'inboxZero',
        'braindumpMaster',
        'systemLearned'
      ]
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Statistics
  totalActionsCompleted: {
    type: Number,
    default: 0
  },
  totalProjectsCompleted: {
    type: Number,
    default: 0
  },
  totalBraindumpsProcessed: {
    type: Number,
    default: 0
  },
  totalInbasketProcessed: {
    type: Number,
    default: 0
  },
  // Quick action stats (2-minute rule)
  quickActionsCompleted: {
    type: Number,
    default: 0
  },
  // Onboarding state
  onboarding: {
    unloadComplete: {
      type: Boolean,
      default: false
    },
    dismissed: {
      type: Boolean,
      default: false
    },
    completedMissions: [{
      type: String
    }]
  }
}, {
  timestamps: true
});

// Point values for different activities
userStatsSchema.statics.POINT_VALUES = {
  completeAction: 10,
  completeQuickAction: 5, // Less points but faster
  completeProject: 50,
  processBraindump: 3,
  processInbasket: 2,
  maintainStreak: 5, // Daily bonus
  achievementBonus: 25
};

// Method to update streak
userStatsSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastActiveDate) {
    this.currentStreak = 1;
    this.lastActiveDate = today;
    return;
  }

  const lastActive = new Date(this.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day, no change
    return;
  } else if (diffDays === 1) {
    // Consecutive day
    this.currentStreak += 1;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  } else {
    // Streak broken
    this.currentStreak = 1;
  }

  this.lastActiveDate = today;
};

// Static method to get or create stats for a user
userStatsSchema.statics.getStats = async function(userId) {
  let stats = await this.findOne({ userId });
  if (!stats) {
    stats = await this.create({ userId });
  }
  return stats;
};

export default mongoose.model('UserStats', userStatsSchema);

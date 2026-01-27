import express from 'express';
import UserStats from '../models/UserStats.js';

const router = express.Router();

// GET user stats
router.get('/', async (req, res) => {
  try {
    const stats = await UserStats.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET streak info
router.get('/streak', async (req, res) => {
  try {
    const stats = await UserStats.getStats();
    res.json({
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastActiveDate: stats.lastActiveDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET point totals
router.get('/points', async (req, res) => {
  try {
    const stats = await UserStats.getStats();
    res.json({
      totalPoints: stats.totalPoints,
      todayPoints: getTodayPoints(stats)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET achievements
router.get('/achievements', async (req, res) => {
  try {
    const stats = await UserStats.getStats();
    res.json({
      earned: stats.achievements,
      available: getAvailableAchievements(stats)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET daily activity (for charts/graphs)
router.get('/activity', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await UserStats.getStats();

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const activity = stats.dailyActivity
      .filter(d => new Date(d.date) >= startDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST check in (for streak maintenance)
router.post('/checkin', async (req, res) => {
  try {
    const stats = await UserStats.getStats();
    const previousStreak = stats.currentStreak;

    stats.updateStreak();

    // Award streak bonus if maintained
    if (stats.currentStreak > previousStreak) {
      stats.totalPoints += UserStats.POINT_VALUES.maintainStreak;

      // Check for streak achievements
      const streakMilestones = [
        { days: 3, type: 'streak3' },
        { days: 7, type: 'streak7' },
        { days: 30, type: 'streak30' }
      ];

      for (const milestone of streakMilestones) {
        if (stats.currentStreak >= milestone.days) {
          const hasAchievement = stats.achievements.some(a => a.type === milestone.type);
          if (!hasAchievement) {
            stats.achievements.push({ type: milestone.type });
            stats.totalPoints += UserStats.POINT_VALUES.achievementBonus;
          }
        }
      }
    }

    // Check for point milestones
    const pointMilestones = [
      { points: 100, type: 'points100' },
      { points: 500, type: 'points500' },
      { points: 1000, type: 'points1000' }
    ];

    for (const milestone of pointMilestones) {
      if (stats.totalPoints >= milestone.points) {
        const hasAchievement = stats.achievements.some(a => a.type === milestone.type);
        if (!hasAchievement) {
          stats.achievements.push({ type: milestone.type });
          stats.totalPoints += UserStats.POINT_VALUES.achievementBonus;
        }
      }
    }

    await stats.save();

    res.json({
      currentStreak: stats.currentStreak,
      totalPoints: stats.totalPoints,
      streakMaintained: stats.currentStreak > previousStreak,
      newAchievements: stats.currentStreak > previousStreak ? checkNewAchievements(stats, previousStreak) : []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper functions
function getTodayPoints(stats) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayActivity = stats.dailyActivity.find(
    d => new Date(d.date).toDateString() === today.toDateString()
  );

  return todayActivity ? todayActivity.pointsEarned : 0;
}

function getAvailableAchievements(stats) {
  const allAchievements = [
    { type: 'firstAction', name: 'First Step', description: 'Complete your first action', icon: '🎯' },
    { type: 'streak3', name: 'Getting Started', description: 'Maintain a 3-day streak', icon: '🔥' },
    { type: 'streak7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '💪' },
    { type: 'streak30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🏆' },
    { type: 'points100', name: 'Century Club', description: 'Earn 100 points', icon: '💯' },
    { type: 'points500', name: 'High Scorer', description: 'Earn 500 points', icon: '⭐' },
    { type: 'points1000', name: 'Point Master', description: 'Earn 1000 points', icon: '🌟' },
    { type: 'projectComplete', name: 'Project Pro', description: 'Complete a project', icon: '📦' },
    { type: 'inboxZero', name: 'Inbox Zero', description: 'Clear your entire inbasket', icon: '📭' },
    { type: 'braindumpMaster', name: 'Mind Clearer', description: 'Process 50 braindump items', icon: '🧠' }
  ];

  const earnedTypes = stats.achievements.map(a => a.type);

  return allAchievements.map(a => ({
    ...a,
    earned: earnedTypes.includes(a.type),
    earnedAt: stats.achievements.find(e => e.type === a.type)?.earnedAt
  }));
}

function checkNewAchievements(stats, previousStreak) {
  const newAchievements = [];
  const streakMilestones = [3, 7, 30];

  for (const milestone of streakMilestones) {
    if (stats.currentStreak >= milestone && previousStreak < milestone) {
      newAchievements.push(`streak${milestone}`);
    }
  }

  return newAchievements;
}

export default router;

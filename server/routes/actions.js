import express from 'express';
import Action from '../models/Action.js';
import UserStats from '../models/UserStats.js';
import generateRecurringActions from '../utils/generateRecurringActions.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// GET all actions with filtering
router.get('/', async (req, res) => {
  try {
    // Generate any pending recurring actions for today (idempotent)
    await generateRecurringActions(req.userId);

    const {
      status,
      context,
      project,
      keyword,
      sortBy = 'deadline',
      sortOrder = 'asc',
      quickOnly,
      limit
    } = req.query;

    const query = { userId: req.userId };

    if (status) query.status = status;
    if (context) query.context = context;
    if (project) query.project = project;
    if (quickOnly === 'true') query.isQuickAction = true;
    if (keyword) {
      query.$or = [
        { keywords: { $in: [keyword.toLowerCase()] } },
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    let queryBuilder = Action.find(query)
      .populate('project', 'title status')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    if (limit) {
      queryBuilder = queryBuilder.limit(parseInt(limit));
    }

    const actions = await queryBuilder;
    res.json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single action
router.get('/:id', async (req, res) => {
  try {
    const action = await Action.findOne({ _id: req.params.id, userId: req.userId }).populate('project');
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }
    res.json(action);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create action
router.post('/', async (req, res) => {
  try {
    const action = new Action({ ...req.body, userId: req.userId });

    // Auto-extract keywords from title and description if not provided
    if (!req.body.keywords || req.body.keywords.length === 0) {
      const text = `${req.body.title} ${req.body.description || ''}`;
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      action.keywords = [...new Set(words)].slice(0, 10);
    }

    const savedAction = await action.save();
    await savedAction.populate('project');
    res.status(201).json(savedAction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update action
router.put('/:id', async (req, res) => {
  try {
    const action = await Action.findOne({ _id: req.params.id, userId: req.userId });
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }

    // Handle completion
    if (req.body.status === 'completed' && action.status !== 'completed') {
      req.body.completedAt = new Date();

      // Award points
      const stats = await UserStats.getStats(req.userId);
      const points = action.isQuickAction
        ? UserStats.POINT_VALUES.completeQuickAction
        : UserStats.POINT_VALUES.completeAction;

      stats.totalPoints += points;
      stats.totalActionsCompleted += 1;
      if (action.isQuickAction) stats.quickActionsCompleted += 1;
      stats.updateStreak();

      // Update daily activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailyIndex = stats.dailyActivity.findIndex(
        d => new Date(d.date).toDateString() === today.toDateString()
      );

      if (dailyIndex >= 0) {
        stats.dailyActivity[dailyIndex].actionsCompleted += 1;
        stats.dailyActivity[dailyIndex].pointsEarned += points;
      } else {
        stats.dailyActivity.push({
          date: today,
          actionsCompleted: 1,
          pointsEarned: points
        });
      }

      await stats.save();
      req.body.pointsAwarded = points;
    }

    Object.assign(action, req.body);
    const updatedAction = await action.save();
    await updatedAction.populate('project');

    res.json(updatedAction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE action
router.delete('/:id', async (req, res) => {
  try {
    const action = await Action.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }
    res.json({ message: 'Action deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST complete action (convenience endpoint)
router.post('/:id/complete', async (req, res) => {
  try {
    const action = await Action.findOne({ _id: req.params.id, userId: req.userId });
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }

    if (action.status === 'completed') {
      return res.status(400).json({ message: 'Action already completed' });
    }

    action.status = 'completed';
    action.completedAt = new Date();

    // Award points
    const stats = await UserStats.getStats(req.userId);
    const points = action.isQuickAction
      ? UserStats.POINT_VALUES.completeQuickAction
      : UserStats.POINT_VALUES.completeAction;

    stats.totalPoints += points;
    stats.totalActionsCompleted += 1;
    if (action.isQuickAction) stats.quickActionsCompleted += 1;
    stats.updateStreak();

    // Update daily activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyIndex = stats.dailyActivity.findIndex(
      d => new Date(d.date).toDateString() === today.toDateString()
    );

    if (dailyIndex >= 0) {
      stats.dailyActivity[dailyIndex].actionsCompleted += 1;
      stats.dailyActivity[dailyIndex].pointsEarned += points;
    } else {
      stats.dailyActivity.push({
        date: today,
        actionsCompleted: 1,
        pointsEarned: points
      });
    }

    await stats.save();
    action.pointsAwarded = points;
    await action.save();
    await action.populate('project');

    res.json({
      action,
      pointsAwarded: points,
      newTotal: stats.totalPoints,
      streak: stats.currentStreak
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

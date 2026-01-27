import express from 'express';
import InbasketItem from '../models/InbasketItem.js';
import Action from '../models/Action.js';
import Project from '../models/Project.js';
import SomedayItem from '../models/SomedayItem.js';
import UserStats from '../models/UserStats.js';

const router = express.Router();

// GET all inbasket items
router.get('/', async (req, res) => {
  try {
    const { status, source, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (source) query.source = source;

    const items = await InbasketItem.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single item
router.get('/:id', async (req, res) => {
  try {
    const item = await InbasketItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create inbasket item
router.post('/', async (req, res) => {
  try {
    const item = new InbasketItem(req.body);
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update inbasket item
router.put('/:id', async (req, res) => {
  try {
    const item = await InbasketItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE inbasket item
router.delete('/:id', async (req, res) => {
  try {
    const item = await InbasketItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST process inbasket item
router.post('/:id/process', async (req, res) => {
  try {
    const { decision, data } = req.body;
    const item = await InbasketItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    let result = null;

    switch (decision) {
      case 'trash':
        item.decision = 'trash';
        break;

      case 'delegate':
        item.decision = 'delegate';
        item.delegatedTo = data.delegatedTo;
        break;

      case 'defer':
        item.decision = 'defer';

        if (data.deferTo === 'action') {
          const action = new Action({
            title: data.title || item.content,
            description: data.description || item.notes,
            context: data.context || '@anywhere',
            deadline: data.deadline,
            estimatedMinutes: data.estimatedMinutes,
            project: data.project,
            priority: data.priority || 3
          });
          result = await action.save();
          item.deferredTo = { type: 'action', refId: result._id, date: data.deadline };
        } else if (data.deferTo === 'project') {
          const project = new Project({
            title: data.title || item.content,
            description: data.description || item.notes,
            purpose: data.purpose,
            desiredOutcome: data.desiredOutcome
          });
          result = await project.save();
          item.deferredTo = { type: 'project', refId: result._id };
        } else if (data.deferTo === 'someday') {
          const someday = new SomedayItem({
            title: data.title || item.content,
            description: data.description || item.notes,
            category: data.category || 'someday'
          });
          result = await someday.save();
          item.deferredTo = { type: 'someday', refId: result._id };
        } else if (data.deferTo === 'calendar') {
          item.deferredTo = { type: 'calendar', date: data.date };
        }
        break;

      case 'doNow':
        // Mark as do now - user will handle it immediately
        item.decision = 'doNow';
        break;

      case 'reference':
        item.decision = 'reference';
        item.referenceLocation = data.referenceLocation;
        break;

      default:
        return res.status(400).json({ message: 'Invalid decision type' });
    }

    item.status = 'processed';
    item.processedAt = new Date();
    await item.save();

    // Award points for processing
    const stats = await UserStats.getStats();
    stats.totalPoints += UserStats.POINT_VALUES.processInbasket;
    stats.totalInbasketProcessed += 1;
    stats.updateStreak();

    // Check for inbox zero achievement
    const unprocessedCount = await InbasketItem.countDocuments({ status: 'unprocessed' });
    if (unprocessedCount === 0) {
      const hasAchievement = stats.achievements.some(a => a.type === 'inboxZero');
      if (!hasAchievement) {
        stats.achievements.push({ type: 'inboxZero' });
        stats.totalPoints += UserStats.POINT_VALUES.achievementBonus;
      }
    }

    await stats.save();

    res.json({
      item,
      result,
      pointsAwarded: UserStats.POINT_VALUES.processInbasket,
      inboxZero: unprocessedCount === 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET unprocessed count
router.get('/meta/unprocessed-count', async (req, res) => {
  try {
    const count = await InbasketItem.countDocuments({ status: 'unprocessed' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

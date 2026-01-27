import express from 'express';
import BraindumpItem from '../models/BraindumpItem.js';
import Action from '../models/Action.js';
import Project from '../models/Project.js';
import SomedayItem from '../models/SomedayItem.js';
import InbasketItem from '../models/InbasketItem.js';
import UserStats from '../models/UserStats.js';

const router = express.Router();

// GET all braindump items
router.get('/', async (req, res) => {
  try {
    const { actionType, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (actionType) query.actionType = actionType;
    if (category) query.category = category;

    const items = await BraindumpItem.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single item
router.get('/:id', async (req, res) => {
  try {
    const item = await BraindumpItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create braindump item (quick capture)
router.post('/', async (req, res) => {
  try {
    const item = new BraindumpItem(req.body);
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST bulk create braindump items
router.post('/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const braindumpItems = items.map(content => ({
      content: typeof content === 'string' ? content : content.content,
      category: typeof content === 'object' ? content.category : 'uncategorized'
    }));

    const savedItems = await BraindumpItem.insertMany(braindumpItems);
    res.status(201).json(savedItems);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update braindump item
router.put('/:id', async (req, res) => {
  try {
    const item = await BraindumpItem.findByIdAndUpdate(
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

// DELETE braindump item
router.delete('/:id', async (req, res) => {
  try {
    const item = await BraindumpItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST process braindump item (convert to action, project, someday, etc.)
router.post('/:id/process', async (req, res) => {
  try {
    const { convertTo, data } = req.body;
    const item = await BraindumpItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    let result = null;

    switch (convertTo) {
      case 'action':
        const action = new Action({
          title: data.title || item.content,
          description: data.description || '',
          context: data.context || '@anywhere',
          deadline: data.deadline || null,
          estimatedMinutes: data.estimatedMinutes || null,
          project: data.project || null,
          priority: data.priority || 3
        });
        result = await action.save();
        item.convertedTo = { type: 'action', refId: result._id };
        break;

      case 'project':
        const project = new Project({
          title: data.title || item.content,
          description: data.description || '',
          purpose: data.purpose,
          desiredOutcome: data.desiredOutcome,
          deadline: data.deadline
        });
        result = await project.save();
        item.convertedTo = { type: 'project', refId: result._id };
        break;

      case 'someday':
        const someday = new SomedayItem({
          title: data.title || item.content,
          description: data.description || '',
          category: data.category || 'someday',
          commitment: data.commitment || 'interested'
        });
        result = await someday.save();
        item.convertedTo = { type: 'someday', refId: result._id };
        break;

      case 'inbasket':
        const inbasket = new InbasketItem({
          content: item.content,
          source: data.source || 'note',
          notes: data.notes || ''
        });
        result = await inbasket.save();
        item.convertedTo = { type: 'inbasket', refId: result._id };
        break;

      case 'delete':
        item.convertedTo = { type: 'deleted', refId: null };
        break;

      default:
        return res.status(400).json({ message: 'Invalid conversion type' });
    }

    item.actionType = convertTo === 'delete' ? 'delete' : 'schedule';
    item.processedAt = new Date();
    await item.save();

    // Award points for processing
    const stats = await UserStats.getStats();
    stats.totalPoints += UserStats.POINT_VALUES.processBraindump;
    stats.totalBraindumpsProcessed += 1;
    stats.updateStreak();
    await stats.save();

    res.json({
      item,
      result,
      pointsAwarded: UserStats.POINT_VALUES.processBraindump
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET unprocessed count
router.get('/meta/unprocessed-count', async (req, res) => {
  try {
    const count = await BraindumpItem.countDocuments({ actionType: 'unprocessed' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

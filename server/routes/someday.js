import express from 'express';
import SomedayItem from '../models/SomedayItem.js';
import Action from '../models/Action.js';
import Project from '../models/Project.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// GET all someday items
router.get('/', async (req, res) => {
  try {
    const { status = 'active', category, commitment, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { userId: req.userId };
    if (status) query.status = status;
    if (category) query.category = category;
    if (commitment) query.commitment = commitment;

    const items = await SomedayItem.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single item
router.get('/:id', async (req, res) => {
  try {
    const item = await SomedayItem.findOne({ _id: req.params.id, userId: req.userId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create someday item
router.post('/', async (req, res) => {
  try {
    const item = new SomedayItem({ ...req.body, userId: req.userId });
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update someday item
router.put('/:id', async (req, res) => {
  try {
    const item = await SomedayItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
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

// DELETE someday item
router.delete('/:id', async (req, res) => {
  try {
    const item = await SomedayItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'deleted' },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST activate someday item (convert to project or action)
router.post('/:id/activate', async (req, res) => {
  try {
    const { activateTo, data } = req.body;
    const item = await SomedayItem.findOne({ _id: req.params.id, userId: req.userId });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    let result = null;

    if (activateTo === 'project') {
      const project = new Project({
        title: data.title || item.title,
        description: data.description || item.description,
        purpose: data.purpose,
        desiredOutcome: data.desiredOutcome,
        deadline: data.deadline,
        category: data.category || item.category,
        userId: req.userId
      });
      result = await project.save();
      item.activatedTo = { type: 'project', refId: result._id };
    } else if (activateTo === 'action') {
      const action = new Action({
        title: data.title || item.title,
        description: data.description || item.description,
        context: data.context || '@anywhere',
        deadline: data.deadline,
        priority: data.priority || 3,
        userId: req.userId
      });
      result = await action.save();
      item.activatedTo = { type: 'action', refId: result._id };
    } else {
      return res.status(400).json({ message: 'Invalid activation type' });
    }

    item.status = 'activated';
    item.activatedAt = new Date();
    await item.save();

    res.json({ item, result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST mark item as reviewed
router.post('/:id/review', async (req, res) => {
  try {
    const item = await SomedayItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { lastReviewedAt: new Date() },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET items needing review (not reviewed in last 7 days)
router.get('/meta/needs-review', async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const items = await SomedayItem.find({
      userId: req.userId,
      status: 'active',
      $or: [
        { lastReviewedAt: null },
        { lastReviewedAt: { $lt: oneWeekAgo } }
      ]
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

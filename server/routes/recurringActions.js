import express from 'express';
import RecurringAction from '../models/RecurringAction.js';
import Action from '../models/Action.js';
import generateRecurringActions from '../utils/generateRecurringActions.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// GET all recurring actions
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.userId };
    if (status) query.status = status;

    const recurringActions = await RecurringAction.find(query)
      .populate('project', 'title status')
      .sort({ createdAt: -1 });

    res.json(recurringActions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single recurring action
router.get('/:id', async (req, res) => {
  try {
    const recurringAction = await RecurringAction.findOne({ _id: req.params.id, userId: req.userId })
      .populate('project');
    if (!recurringAction) {
      return res.status(404).json({ message: 'Recurring action not found' });
    }
    res.json(recurringAction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create recurring action
router.post('/', async (req, res) => {
  try {
    const recurringAction = new RecurringAction({ ...req.body, userId: req.userId });
    const saved = await recurringAction.save();
    await saved.populate('project');

    // Immediately generate today's action if applicable
    await generateRecurringActions(req.userId);

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update recurring action
router.put('/:id', async (req, res) => {
  try {
    const recurringAction = await RecurringAction.findOne({ _id: req.params.id, userId: req.userId });
    if (!recurringAction) {
      return res.status(404).json({ message: 'Recurring action not found' });
    }

    Object.assign(recurringAction, req.body);
    const updated = await recurringAction.save();
    await updated.populate('project');

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE recurring action
router.delete('/:id', async (req, res) => {
  try {
    const { deleteFutureActions } = req.query;
    const recurringAction = await RecurringAction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!recurringAction) {
      return res.status(404).json({ message: 'Recurring action not found' });
    }

    if (deleteFutureActions === 'true') {
      await Action.deleteMany({
        recurringActionId: req.params.id,
        userId: req.userId,
        status: { $ne: 'completed' }
      });
    }

    res.json({ message: 'Recurring action deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

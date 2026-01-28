import express from 'express';
import Project from '../models/Project.js';
import Action from '../models/Action.js';
import UserStats from '../models/UserStats.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// GET all projects
router.get('/', async (req, res) => {
  try {
    const { status, category, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

    const query = { userId: req.userId };
    if (status) query.status = status;
    if (category) query.category = category;

    const projects = await Project.find(query)
      .populate('actions')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single project with actions
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId }).populate('actions');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create project (with optional initial actions)
router.post('/', async (req, res) => {
  try {
    const { actions: initialActions, ...projectData } = req.body;

    const project = new Project({ ...projectData, userId: req.userId });
    const savedProject = await project.save();

    // Create initial actions if provided
    if (initialActions && initialActions.length > 0) {
      const actionsToCreate = initialActions.map(action => ({
        ...action,
        project: savedProject._id,
        userId: req.userId
      }));
      await Action.insertMany(actionsToCreate);
    }

    // Fetch project with actions
    const populatedProject = await Project.findById(savedProject._id).populate('actions');
    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update project
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Handle completion
    if (req.body.status === 'completed' && project.status !== 'completed') {
      req.body.completedAt = new Date();

      // Award points
      const stats = await UserStats.getStats(req.userId);
      const points = UserStats.POINT_VALUES.completeProject;

      stats.totalPoints += points;
      stats.totalProjectsCompleted += 1;
      stats.updateStreak();
      await stats.save();

      req.body.totalPointsAwarded = (project.totalPointsAwarded || 0) + points;
    }

    Object.assign(project, req.body);
    const updatedProject = await project.save();
    await updatedProject.populate('actions');

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE project (optionally delete associated actions)
router.delete('/:id', async (req, res) => {
  try {
    const { deleteActions = 'false' } = req.query;

    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (deleteActions === 'true') {
      await Action.deleteMany({ project: project._id, userId: req.userId });
    } else {
      // Unlink actions from project
      await Action.updateMany({ project: project._id, userId: req.userId }, { project: null });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST add action to project
router.post('/:id/actions', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const action = new Action({
      ...req.body,
      project: project._id,
      userId: req.userId
    });
    await action.save();

    const updatedProject = await Project.findById(req.params.id).populate('actions');
    res.status(201).json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET project categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Project.distinct('category', { userId: req.userId });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

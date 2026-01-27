import express from 'express';
import Project from '../models/Project.js';
import Action from '../models/Action.js';
import UserStats from '../models/UserStats.js';

const router = express.Router();

// GET all projects
router.get('/', async (req, res) => {
  try {
    const { status, category, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

    const query = {};
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
    const project = await Project.findById(req.params.id).populate('actions');
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

    const project = new Project(projectData);
    const savedProject = await project.save();

    // Create initial actions if provided
    if (initialActions && initialActions.length > 0) {
      const actionsToCreate = initialActions.map(action => ({
        ...action,
        project: savedProject._id
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
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Handle completion
    if (req.body.status === 'completed' && project.status !== 'completed') {
      req.body.completedAt = new Date();

      // Award points
      const stats = await UserStats.getStats();
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

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (deleteActions === 'true') {
      await Action.deleteMany({ project: project._id });
    } else {
      // Unlink actions from project
      await Action.updateMany({ project: project._id }, { project: null });
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
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const action = new Action({
      ...req.body,
      project: project._id
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
    const categories = await Project.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

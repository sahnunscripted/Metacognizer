import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Modal, Input, Select, ProgressBar, Badge, EmptyState } from '../../components/common';
import ActionList from '../../components/actions/ActionList/ActionList';
import ActionForm from '../../components/actions/ActionForm/ActionForm';
import { projectsApi } from '../../services/api';
import { useCelebration } from '../../context/CelebrationContext';
import { useStats } from '../../context/StatsContext';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'onHold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'someday', label: 'Someday' }
];

function ProjectCard({ project, onClick, onComplete }) {
  const progress = project.progress || 0;
  const actionCount = project.actions?.length || 0;
  const completedCount = project.actions?.filter(a => a.status === 'completed').length || 0;

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={project.status === 'completed' ? 'opacity-60' : ''}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className={`font-medium ${project.status === 'completed' ? 'line-through text-dark-400' : 'text-dark-100'}`}>
            {project.title}
          </h3>
          {project.purpose && (
            <p className="text-sm text-dark-500 mt-0.5">Why: {project.purpose}</p>
          )}
        </div>
        <Badge variant={project.status === 'active' ? 'primary' : 'default'} size="sm">
          {project.status}
        </Badge>
      </div>

      {project.description && (
        <p className="text-sm text-dark-400 mb-3 line-clamp-2">{project.description}</p>
      )}

      <div className="space-y-2">
        <ProgressBar
          value={completedCount}
          max={actionCount || 1}
          size="sm"
          color={progress === 100 ? 'success' : 'primary'}
          showLabel
          label={`${completedCount}/${actionCount} actions`}
        />

        {project.nextAction && (
          <p className="text-xs text-primary-400">
            Next: {project.nextAction.title}
          </p>
        )}
      </div>
    </Card>
  );
}

function ProjectForm({ project = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    purpose: '',
    desiredOutcome: '',
    status: 'active',
    category: 'general',
    deadline: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        purpose: project.purpose || '',
        desiredOutcome: project.desiredOutcome || '',
        status: project.status || 'active',
        category: project.category || 'general',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
      });
    }
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        deadline: formData.deadline || null
      };

      let response;
      if (project) {
        response = await projectsApi.update(project._id, data);
      } else {
        response = await projectsApi.create(data);
      }

      onSave?.(response.data);
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Project Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="What's the outcome you're after?"
        autoFocus
        required
      />

      <Input
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="What does this project involve?"
      />

      <Input
        label="Purpose (Why?)"
        name="purpose"
        value={formData.purpose}
        onChange={handleChange}
        placeholder="Why is this important?"
      />

      <Input
        label="Desired Outcome"
        name="desiredOutcome"
        value={formData.desiredOutcome}
        onChange={handleChange}
        placeholder="What does success look like?"
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={STATUS_OPTIONS}
        />

        <Input
          label="Deadline (optional)"
          name="deadline"
          type="date"
          value={formData.deadline}
          onChange={handleChange}
        />
      </div>

      <Input
        label="Category"
        name="category"
        value={formData.category}
        onChange={handleChange}
        placeholder="e.g., work, personal, health"
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={saving} className="flex-1">
          {project ? 'Update' : 'Create'} Project
        </Button>
      </div>
    </form>
  );
}

function ProjectDetails({ project, onClose, onUpdate }) {
  const [showActionForm, setShowActionForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { celebrate } = useCelebration();
  const { refreshStats } = useStats();

  const handleCompleteProject = async () => {
    try {
      const response = await projectsApi.update(project._id, { status: 'completed' });
      celebrate('project', 50, 'Project completed!');
      refreshStats();
      onUpdate(response.data);
    } catch (error) {
      console.error('Failed to complete project:', error);
    }
  };

  const handleActionSave = () => {
    setShowActionForm(false);
    setRefreshKey(k => k + 1);
  };

  const allActionsComplete = project.actions?.length > 0 &&
    project.actions.every(a => a.status === 'completed');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-dark-100">{project.title}</h3>
        {project.purpose && (
          <p className="text-sm text-dark-400 mt-1">Why: {project.purpose}</p>
        )}
        {project.desiredOutcome && (
          <p className="text-sm text-dark-400 mt-1">Outcome: {project.desiredOutcome}</p>
        )}
      </div>

      {project.description && (
        <p className="text-dark-300">{project.description}</p>
      )}

      <ProgressBar
        value={project.actions?.filter(a => a.status === 'completed').length || 0}
        max={project.actions?.length || 1}
        color="primary"
        showLabel
        label="Progress"
      />

      {/* Actions Section */}
      <div className="border-t border-dark-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-dark-200">Actions</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowActionForm(true)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Action
          </Button>
        </div>

        <ActionList
          key={refreshKey}
          projectId={project._id}
          showFilters={false}
        />
      </div>

      {/* Complete Project Button */}
      {project.status !== 'completed' && allActionsComplete && (
        <Button
          variant="success"
          fullWidth
          onClick={handleCompleteProject}
        >
          Complete Project
        </Button>
      )}

      {/* Action Form Modal */}
      <Modal
        isOpen={showActionForm}
        onClose={() => setShowActionForm(false)}
        title="Add Action"
        size="lg"
      >
        <ActionForm
          projectId={project._id}
          onSave={handleActionSave}
          onCancel={() => setShowActionForm(false)}
        />
      </Modal>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [filter, setFilter] = useState('active');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const response = await projectsApi.getAll(params);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const handleSave = (project) => {
    setShowForm(false);
    setSelectedProject(null);
    fetchProjects();
  };

  const handleProjectUpdate = (updatedProject) => {
    setProjects(prev =>
      prev.map(p => p._id === updatedProject._id ? updatedProject : p)
    );
    setViewingProject(updatedProject);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-dark-100">Projects</h1>
        <Button
          onClick={() => {
            setSelectedProject(null);
            setShowForm(true);
          }}
          size="sm"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['active', 'onHold', 'completed', 'someday', ''].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
              transition-all duration-200
              ${filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }
            `}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-dark-800 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
          title="No projects yet"
          description="Create your first project to start organizing your actions"
          action={() => setShowForm(true)}
          actionLabel="Create Project"
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {projects.map(project => (
              <motion.div
                key={project._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ProjectCard
                  project={project}
                  onClick={() => setViewingProject(project)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Project Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedProject(null);
        }}
        title={selectedProject ? 'Edit Project' : 'New Project'}
        size="lg"
      >
        <ProjectForm
          project={selectedProject}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setSelectedProject(null);
          }}
        />
      </Modal>

      {/* Project Details Modal */}
      <Modal
        isOpen={!!viewingProject}
        onClose={() => setViewingProject(null)}
        title="Project Details"
        size="lg"
      >
        {viewingProject && (
          <ProjectDetails
            project={viewingProject}
            onClose={() => setViewingProject(null)}
            onUpdate={handleProjectUpdate}
          />
        )}
      </Modal>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Modal, Input, Select, Badge, EmptyState } from '../../components/common';
import { braindumpApi, projectsApi } from '../../services/api';
import { useCelebration } from '../../context/CelebrationContext';
import { useStats } from '../../context/StatsContext';

const CATEGORIES = [
  { value: 'uncategorized', label: 'Uncategorized' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'toBuy', label: 'To Buy' },
  { value: 'email', label: 'Email' },
  { value: 'someday', label: 'Someday' },
  { value: 'squirrel', label: 'Squirrel (Random)' }
];

const CONTEXTS = [
  { value: '@anywhere', label: '@anywhere' },
  { value: '@phone', label: '@phone' },
  { value: '@computer', label: '@computer' },
  { value: '@office', label: '@office' },
  { value: '@errands', label: '@errands' },
  { value: '@home', label: '@home' }
];

function ProcessingWizard({ item, projects, onProcess, onClose }) {
  const [step, setStep] = useState(1);
  const [decision, setDecision] = useState(null);
  const [formData, setFormData] = useState({
    title: item.content,
    description: '',
    context: '@anywhere',
    deadline: '',
    estimatedMinutes: '',
    project: '',
    category: 'someday'
  });

  const handleDecision = (type) => {
    setDecision(type);
    if (type === 'delete') {
      onProcess(item._id, 'delete', {});
    } else if (type === 'doNow') {
      // Mark as do now and close
      onProcess(item._id, 'delete', {}); // Just delete it, they'll do it now
    } else {
      setStep(2);
    }
  };

  const handleProcess = () => {
    // Clean up empty strings to null for proper backend handling
    const cleanedData = {
      ...formData,
      deadline: formData.deadline || null,
      estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : null,
      project: formData.project || null
    };
    onProcess(item._id, decision, cleanedData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Item being processed */}
      <Card variant="glass" padding="sm">
        <p className="text-dark-100 font-medium">{item.content}</p>
      </Card>

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-dark-400 text-sm">What should happen with this?</p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => handleDecision('action')}
              className="flex flex-col items-center py-4"
            >
              <span className="text-2xl mb-1">✓</span>
              <span>It's an Action</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleDecision('project')}
              className="flex flex-col items-center py-4"
            >
              <span className="text-2xl mb-1">📁</span>
              <span>It's a Project</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleDecision('someday')}
              className="flex flex-col items-center py-4"
            >
              <span className="text-2xl mb-1">⭐</span>
              <span>Someday/Maybe</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleDecision('doNow')}
              className="flex flex-col items-center py-4"
            >
              <span className="text-2xl mb-1">⚡</span>
              <span>Do it Now!</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleDecision('delete')}
              className="col-span-2 text-dark-500"
            >
              Not actionable - Delete
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && decision === 'action' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Input
            label="What's the next physical action?"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Context"
              name="context"
              value={formData.context}
              onChange={handleChange}
              options={CONTEXTS}
            />

            <Input
              label="Est. Minutes"
              name="estimatedMinutes"
              type="number"
              value={formData.estimatedMinutes}
              onChange={handleChange}
              placeholder="e.g., 15"
            />
          </div>

          <Input
            label="Deadline (optional)"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
          />

          <Select
            label="Add to Project (optional)"
            name="project"
            value={formData.project}
            onChange={handleChange}
            options={[
              { value: '', label: 'No project' },
              ...projects.map(p => ({ value: p._id, label: p.title }))
            ]}
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button onClick={handleProcess} className="flex-1">
              Create Action
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && decision === 'project' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Input
            label="Project Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What does this project involve?"
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button onClick={handleProcess} className="flex-1">
              Create Project
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && decision === 'someday' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />

          <Input
            label="Description (optional)"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />

          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={[
              { value: 'someday', label: 'Someday' },
              { value: 'maybe', label: 'Maybe' },
              { value: 'idea', label: 'Idea' },
              { value: 'book', label: 'Book to Read' },
              { value: 'movie', label: 'Movie to Watch' },
              { value: 'skill', label: 'Skill to Learn' },
              { value: 'travel', label: 'Place to Visit' },
              { value: 'hobby', label: 'Hobby' }
            ]}
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button onClick={handleProcess} className="flex-1">
              Add to Someday
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function BraindumpPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [processing, setProcessing] = useState(null);
  const [projects, setProjects] = useState([]);
  const inputRef = useRef(null);
  const { celebrate } = useCelebration();
  const { refreshStats } = useStats();

  const fetchItems = async () => {
    try {
      const response = await braindumpApi.getAll({ actionType: 'unprocessed' });
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getAll({ status: 'active' });
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchProjects();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const response = await braindumpApi.create({ content: inputValue.trim() });
      setItems(prev => [response.data, ...prev]);
      setInputValue('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleProcess = async (itemId, convertTo, data) => {
    try {
      await braindumpApi.process(itemId, convertTo, data);
      setItems(prev => prev.filter(i => i._id !== itemId));
      setProcessing(null);
      celebrate('action', 3, 'Item processed!');
      refreshStats();
    } catch (error) {
      console.error('Failed to process item:', error);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await braindumpApi.delete(itemId);
      setItems(prev => prev.filter(i => i._id !== itemId));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const unprocessedCount = items.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dark-100">Brain Dump</h1>
          <p className="text-sm text-dark-500">Get everything out of your head</p>
        </div>
        {unprocessedCount > 0 && (
          <Badge variant="warning" size="lg">
            {unprocessedCount} to process
          </Badge>
        )}
      </div>

      {/* Quick Add */}
      <form onSubmit={handleAdd}>
        <Card variant="glass" padding="sm">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1"
              containerClassName="flex-1"
            />
            <Button type="submit" disabled={!inputValue.trim()}>
              Dump
            </Button>
          </div>
        </Card>
      </form>

      {/* Tips */}
      <Card variant="default" padding="sm" className="border-primary-500/30">
        <p className="text-xs text-dark-400">
          <span className="text-primary-400 font-medium">Tip:</span> Don't organize yet! Just dump everything here, then process each item.
        </p>
      </Card>

      {/* Items List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-dark-800 rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
          title="Mind like water"
          description="Your brain is clear! Add thoughts as they come up."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  variant="interactive"
                  onClick={() => setProcessing(item)}
                  className="flex items-center justify-between"
                >
                  <p className="text-dark-100 flex-1">{item.content}</p>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item._id);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                    <svg className="w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Processing Modal */}
      <Modal
        isOpen={!!processing}
        onClose={() => setProcessing(null)}
        title="Process Item"
        size="lg"
      >
        {processing && (
          <ProcessingWizard
            item={processing}
            projects={projects}
            onProcess={handleProcess}
            onClose={() => setProcessing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

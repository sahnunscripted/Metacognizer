import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Modal, Input, Select, Badge, EmptyState } from '../../components/common';
import { inbasketApi, projectsApi } from '../../services/api';
import { useCelebration } from '../../context/CelebrationContext';
import { useStats } from '../../context/StatsContext';

const SOURCES = [
  { value: 'email', label: 'Email' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'note', label: 'Note' },
  { value: 'document', label: 'Document' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'idea', label: 'Idea' },
  { value: 'other', label: 'Other' }
];

const CONTEXTS = [
  { value: '@anywhere', label: '@anywhere' },
  { value: '@phone', label: '@phone' },
  { value: '@computer', label: '@computer' },
  { value: '@office', label: '@office' },
  { value: '@errands', label: '@errands' },
  { value: '@home', label: '@home' }
];

function ProcessingFlow({ item, projects, onProcess, onClose }) {
  const [step, setStep] = useState(1);
  const [decision, setDecision] = useState(null);
  const [formData, setFormData] = useState({
    title: item.content,
    description: '',
    context: '@anywhere',
    deadline: '',
    estimatedMinutes: '',
    project: '',
    delegatedTo: '',
    referenceLocation: '',
    deferTo: 'action'
  });

  const handleDecision = (type) => {
    setDecision(type);
    if (type === 'trash') {
      onProcess(item._id, 'trash', {});
    } else if (type === 'doNow') {
      onProcess(item._id, 'doNow', {});
    } else {
      setStep(2);
    }
  };

  const handleProcess = () => {
    onProcess(item._id, decision, formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isQuickAction = formData.estimatedMinutes && parseInt(formData.estimatedMinutes) <= 2;

  return (
    <div className="space-y-4">
      {/* Item being processed */}
      <Card variant="glass" padding="sm">
        <div className="flex items-start justify-between">
          <p className="text-dark-100 font-medium">{item.content}</p>
          <Badge variant="default" size="sm">{item.source}</Badge>
        </div>
        {item.notes && (
          <p className="text-sm text-dark-400 mt-2">{item.notes}</p>
        )}
      </Card>

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-dark-400 text-sm font-medium">Is this actionable?</p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="success"
              onClick={() => handleDecision('defer')}
              className="flex flex-col items-center py-4"
            >
              <span className="text-2xl mb-1">📋</span>
              <span>Yes - Defer it</span>
              <span className="text-xs opacity-75">Takes more than 2 min</span>
            </Button>

            <Button
              variant="primary"
              onClick={() => handleDecision('doNow')}
              className="flex flex-col items-center py-4"
            >
              <span className="text-2xl mb-1">⚡</span>
              <span>Yes - Do it now!</span>
              <span className="text-xs opacity-75">Less than 2 min</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleDecision('delegate')}
              className="flex flex-col items-center py-4"
            >
              <span className="text-2xl mb-1">👤</span>
              <span>Delegate it</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleDecision('reference')}
              className="flex flex-col items-center py-4"
            >
              <span className="text-2xl mb-1">📁</span>
              <span>Reference</span>
              <span className="text-xs opacity-75">Save for later</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => handleDecision('trash')}
              className="col-span-2 text-dark-500"
            >
              No action needed - Trash it
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && decision === 'defer' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Select
            label="Defer to..."
            name="deferTo"
            value={formData.deferTo}
            onChange={handleChange}
            options={[
              { value: 'action', label: 'Next Actions List' },
              { value: 'project', label: 'Create as Project' },
              { value: 'someday', label: 'Someday/Maybe' },
              { value: 'calendar', label: 'Calendar (specific date)' }
            ]}
          />

          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />

          {formData.deferTo === 'action' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Context"
                  name="context"
                  value={formData.context}
                  onChange={handleChange}
                  options={CONTEXTS}
                />

                <div>
                  <Input
                    label="Est. Minutes"
                    name="estimatedMinutes"
                    type="number"
                    value={formData.estimatedMinutes}
                    onChange={handleChange}
                    placeholder="e.g., 15"
                  />
                  {isQuickAction && (
                    <p className="text-xs text-warning-400 mt-1">
                      This is under 2 min - consider doing it now!
                    </p>
                  )}
                </div>
              </div>

              <Input
                label="Deadline (optional)"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
              />

              <Select
                label="Project (optional)"
                name="project"
                value={formData.project}
                onChange={handleChange}
                options={[
                  { value: '', label: 'No project' },
                  ...projects.map(p => ({ value: p._id, label: p.title }))
                ]}
              />
            </>
          )}

          {formData.deferTo === 'calendar' && (
            <Input
              label="Date"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button onClick={handleProcess} className="flex-1">
              Process
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && decision === 'delegate' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Input
            label="Delegate to whom?"
            name="delegatedTo"
            value={formData.delegatedTo}
            onChange={handleChange}
            placeholder="Name or role"
            autoFocus
          />

          <Input
            label="Notes (optional)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Any additional context"
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button onClick={handleProcess} className="flex-1">
              Mark Delegated
            </Button>
          </div>
        </motion.div>
      )}

      {step === 2 && decision === 'reference' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Input
            label="Where will you file this?"
            name="referenceLocation"
            value={formData.referenceLocation}
            onChange={handleChange}
            placeholder="e.g., Google Drive, Notion, Filing Cabinet"
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button onClick={handleProcess} className="flex-1">
              Save Reference
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function InbasketPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [projects, setProjects] = useState([]);
  const [newItem, setNewItem] = useState({ content: '', source: 'note', notes: '' });
  const { celebrate } = useCelebration();
  const { refreshStats } = useStats();

  const fetchItems = async () => {
    try {
      const response = await inbasketApi.getAll({ status: 'unprocessed' });
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
    if (!newItem.content.trim()) return;

    try {
      const response = await inbasketApi.create(newItem);
      setItems(prev => [response.data, ...prev]);
      setNewItem({ content: '', source: 'note', notes: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleProcess = async (itemId, decision, data) => {
    try {
      const response = await inbasketApi.process(itemId, decision, data);
      setItems(prev => prev.filter(i => i._id !== itemId));
      setProcessing(null);

      if (response.data.inboxZero) {
        celebrate('inboxZero', 25, 'Inbox Zero!');
      } else {
        celebrate('action', 2, 'Processed!');
      }
      refreshStats();
    } catch (error) {
      console.error('Failed to process item:', error);
    }
  };

  const unprocessedCount = items.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dark-100">In-Basket</h1>
          <p className="text-sm text-dark-500">Process everything that comes in</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </Button>
      </div>

      {/* Count Badge */}
      {unprocessedCount > 0 && (
        <Card variant="glass" padding="sm" className="flex items-center justify-between">
          <span className="text-dark-300">Items to process</span>
          <Badge variant={unprocessedCount > 10 ? 'danger' : unprocessedCount > 5 ? 'warning' : 'primary'} size="lg">
            {unprocessedCount}
          </Badge>
        </Card>
      )}

      {/* GTD Reminder */}
      <Card variant="default" padding="sm" className="border-primary-500/30">
        <p className="text-xs text-dark-400">
          <span className="text-primary-400 font-medium">GTD Process:</span> For each item, ask: "What is this?" and "Is it actionable?" Then: Trash, Delegate, Defer, or Do it now (if under 2 min).
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
          title="Inbox Zero!"
          description="Everything has been processed. Great job!"
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
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-dark-100">{item.content}</p>
                      {item.notes && (
                        <p className="text-sm text-dark-500 mt-1">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant="default" size="sm">{item.source}</Badge>
                      <svg className="w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add to In-Basket"
        size="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="What is it?"
            value={newItem.content}
            onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Describe the item..."
            autoFocus
          />

          <Select
            label="Source"
            value={newItem.source}
            onChange={(e) => setNewItem(prev => ({ ...prev, source: e.target.value }))}
            options={SOURCES}
          />

          <Input
            label="Notes (optional)"
            value={newItem.notes}
            onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional details..."
          />

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!newItem.content.trim()}>
              Add
            </Button>
          </div>
        </form>
      </Modal>

      {/* Processing Modal */}
      <Modal
        isOpen={!!processing}
        onClose={() => setProcessing(null)}
        title="Process Item"
        size="lg"
      >
        {processing && (
          <ProcessingFlow
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

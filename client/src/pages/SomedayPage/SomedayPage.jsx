import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { Card, Button, Modal, Input, Select, Badge, EmptyState } from '../../components/common';
import { somedayApi } from '../../services/api';
import { useOnboarding } from '../../context/OnboardingContext';

const CATEGORIES = [
  { value: 'someday', label: 'Someday' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'idea', label: 'Ideas' },
  { value: 'book', label: 'Books to Read' },
  { value: 'movie', label: 'Movies/Shows' },
  { value: 'skill', label: 'Skills to Learn' },
  { value: 'travel', label: 'Places to Visit' },
  { value: 'hobby', label: 'Hobbies' },
  { value: 'other', label: 'Other' }
];

const COMMITMENT_OPTIONS = [
  { value: 'committed', label: 'Committed - Will do someday' },
  { value: 'interested', label: 'Interested - Might do' },
  { value: 'curious', label: 'Curious - Just exploring' }
];

function SomedayItemCard({ item, onActivate, onReview, onEdit }) {
  const needsReview = !item.lastReviewedAt ||
    differenceInDays(new Date(), new Date(item.lastReviewedAt)) >= 7;

  return (
    <Card variant="interactive" onClick={onEdit}>
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-medium text-dark-100">{item.title}</h3>
        {needsReview && (
          <Badge variant="warning" size="sm">Review</Badge>
        )}
      </div>

      {item.description && (
        <p className="text-sm text-dark-400 mb-2 line-clamp-2">{item.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={item.category} size="sm">
            {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
          </Badge>
          <span className="text-xs text-dark-500">
            {item.commitment === 'committed' ? '⭐' : item.commitment === 'interested' ? '💭' : '❓'}
          </span>
        </div>

        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReview}
            className="text-xs"
          >
            Reviewed
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onActivate}
            className="text-xs"
          >
            Activate
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SomedayForm({ item = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'someday',
    commitment: 'interested'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        category: item.category || 'someday',
        commitment: item.commitment || 'interested'
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      let response;
      if (item) {
        response = await somedayApi.update(item._id, formData);
      } else {
        response = await somedayApi.create(formData);
      }
      onSave?.(response.data);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="What's the idea?"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="e.g., Learn to play guitar"
        autoFocus
      />

      <Input
        label="Description (optional)"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Add more details..."
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={CATEGORIES}
        />

        <Select
          label="Commitment Level"
          name="commitment"
          value={formData.commitment}
          onChange={handleChange}
          options={COMMITMENT_OPTIONS}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={saving} className="flex-1">
          {item ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  );
}

function ActivateModal({ item, onActivate, onClose }) {
  const [activateTo, setActivateTo] = useState('project');
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    context: '@anywhere',
    deadline: ''
  });
  const [activating, setActivating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      await somedayApi.activate(item._id, activateTo, formData);
      onActivate();
    } catch (error) {
      console.error('Failed to activate:', error);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card variant="glass" padding="sm">
        <p className="text-dark-100 font-medium">{item.title}</p>
        {item.description && (
          <p className="text-sm text-dark-400 mt-1">{item.description}</p>
        )}
      </Card>

      <div className="flex gap-2">
        <Button
          variant={activateTo === 'project' ? 'primary' : 'secondary'}
          onClick={() => setActivateTo('project')}
          className="flex-1"
        >
          As Project
        </Button>
        <Button
          variant={activateTo === 'action' ? 'primary' : 'secondary'}
          onClick={() => setActivateTo('action')}
          className="flex-1"
        >
          As Action
        </Button>
      </div>

      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
      />

      {activateTo === 'action' && (
        <>
          <Select
            label="Context"
            name="context"
            value={formData.context}
            onChange={handleChange}
            options={[
              { value: '@anywhere', label: '@anywhere' },
              { value: '@phone', label: '@phone' },
              { value: '@computer', label: '@computer' },
              { value: '@office', label: '@office' },
              { value: '@errands', label: '@errands' },
              { value: '@home', label: '@home' }
            ]}
          />

          <Input
            label="Deadline (optional)"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
          />
        </>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleActivate} loading={activating} className="flex-1">
          Activate
        </Button>
      </div>
    </div>
  );
}

export default function SomedayPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activatingItem, setActivatingItem] = useState(null);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = { status: 'active' };
      if (filter) params.category = filter;
      const response = await somedayApi.getAll(params);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const { completeMission } = useOnboarding();

  const handleSave = async () => {
    if (!editingItem) {
      const wasFirstTime = await completeMission('someday');
      if (wasFirstTime) {
        setTimeout(() => navigate('/'), 1500);
      }
    }
    setShowForm(false);
    setEditingItem(null);
    fetchItems();
  };

  const handleReview = async (item) => {
    try {
      await somedayApi.review(item._id);
      setItems(prev =>
        prev.map(i => i._id === item._id ? { ...i, lastReviewedAt: new Date() } : i)
      );
    } catch (error) {
      console.error('Failed to mark reviewed:', error);
    }
  };

  const handleActivate = () => {
    setActivatingItem(null);
    fetchItems();
  };

  const handleDelete = async (itemId) => {
    try {
      await somedayApi.delete(itemId);
      setItems(prev => prev.filter(i => i._id !== itemId));
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const needsReviewCount = items.filter(item =>
    !item.lastReviewedAt || differenceInDays(new Date(), new Date(item.lastReviewedAt)) >= 7
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dark-100">Someday/Maybe</h1>
          <p className="text-sm text-dark-500">Dreams, ideas, and possibilities</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          size="sm"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </Button>
      </div>

      {/* Review reminder */}
      {needsReviewCount > 0 && (
        <Card variant="glass" padding="sm" className="border-warning-500/30">
          <p className="text-sm text-dark-300">
            <span className="text-warning-400 font-medium">{needsReviewCount} items</span> need review. Tap "Reviewed" on items you've considered this week.
          </p>
        </Card>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilter('')}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
            transition-all duration-200
            ${filter === ''
              ? 'bg-primary-500 text-white'
              : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
            }
          `}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
              transition-all duration-200
              ${filter === cat.value
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-dark-800 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          title={filter ? `No ${CATEGORIES.find(c => c.value === filter)?.label.toLowerCase()}` : "No items yet"}
          description="Add dreams and ideas you might want to pursue someday"
          action={() => setShowForm(true)}
          actionLabel="Add First Item"
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.03 }}
              >
                <SomedayItemCard
                  item={item}
                  onActivate={() => setActivatingItem(item)}
                  onReview={() => handleReview(item)}
                  onEdit={() => setEditingItem(item)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={showForm || !!editingItem}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Item' : 'Add to Someday/Maybe'}
        size="md"
        footer={
          editingItem && (
            <Button
              variant="danger"
              fullWidth
              onClick={() => handleDelete(editingItem._id)}
            >
              Delete Item
            </Button>
          )
        }
      >
        <SomedayForm
          item={editingItem}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      </Modal>

      {/* Activate Modal */}
      <Modal
        isOpen={!!activatingItem}
        onClose={() => setActivatingItem(null)}
        title="Activate Item"
        size="md"
      >
        {activatingItem && (
          <ActivateModal
            item={activatingItem}
            onActivate={handleActivate}
            onClose={() => setActivatingItem(null)}
          />
        )}
      </Modal>
    </div>
  );
}

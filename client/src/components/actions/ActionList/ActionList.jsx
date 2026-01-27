import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ActionItem from '../ActionItem/ActionItem';
import { EmptyState, Input, Select, Badge } from '../../common';
import { actionsApi } from '../../../services/api';

const CONTEXTS = [
  { value: '', label: 'All Contexts' },
  { value: '@phone', label: '@phone' },
  { value: '@computer', label: '@computer' },
  { value: '@office', label: '@office' },
  { value: '@errands', label: '@errands' },
  { value: '@home', label: '@home' },
  { value: '@anywhere', label: '@anywhere' },
  { value: '@waiting', label: '@waiting' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: '', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'waiting', label: 'Waiting For' }
];

const SORT_OPTIONS = [
  { value: 'deadline', label: 'Deadline' },
  { value: 'priority', label: 'Priority' },
  { value: 'createdAt', label: 'Created' }
];

export default function ActionList({
  projectId = null,
  showFilters = true,
  onActionClick,
  limit
}) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'active',
    context: '',
    keyword: '',
    quickOnly: false,
    sortBy: 'deadline'
  });

  const fetchActions = async () => {
    setLoading(true);
    try {
      // Priority sort should be ascending (1 = highest priority comes first)
      // Deadline and createdAt should be ascending (earliest first)
      const sortOrder = filters.sortBy === 'priority' ? 'asc' : 'asc';

      const params = {
        ...filters,
        sortBy: filters.sortBy,
        sortOrder
      };
      if (projectId) params.project = projectId;
      if (limit) params.limit = limit;
      if (!params.status) delete params.status;
      if (!params.context) delete params.context;
      if (!params.keyword) delete params.keyword;

      const response = await actionsApi.getAll(params);
      setActions(response.data);
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [filters, projectId, limit]);

  const handleUpdate = (updatedAction) => {
    setActions(prev =>
      prev.map(a => a._id === updatedAction._id ? updatedAction : a)
    );
  };

  const quickActions = actions.filter(a => a.isQuickAction && a.status === 'active');
  const regularActions = actions.filter(a => !a.isQuickAction || a.status !== 'active');

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilters(f => ({ ...f, status: opt.value }))}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                  transition-all duration-200
                  ${filters.status === opt.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search actions..."
              value={filters.keyword}
              onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
              className="flex-1"
              size="sm"
            />
            <Select
              value={filters.context}
              onChange={(e) => setFilters(f => ({ ...f, context: e.target.value }))}
              options={CONTEXTS}
              size="sm"
              className="w-32"
              fullWidth={false}
            />
            <Select
              value={filters.sortBy}
              onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
              options={SORT_OPTIONS}
              size="sm"
              className="w-28"
              fullWidth={false}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-dark-400 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.quickOnly}
              onChange={(e) => setFilters(f => ({ ...f, quickOnly: e.target.checked }))}
              className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
            />
            Show only quick actions (2 min rule)
          </label>
        </div>
      )}

      {/* Quick Actions Section */}
      {quickActions.length > 0 && filters.status === 'active' && !filters.quickOnly && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="success">Quick Wins</Badge>
            <span className="text-xs text-dark-500">2 minutes or less</span>
          </div>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {quickActions.map((action) => (
                <motion.div
                  key={action._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <ActionItem
                    action={action}
                    onUpdate={handleUpdate}
                    onClick={() => onActionClick?.(action)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Regular Actions */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-dark-800 rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : actions.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          title="No actions found"
          description={filters.keyword || filters.context ? "Try adjusting your filters" : "Add your first action to get started"}
        />
      ) : (
        <div className="space-y-2">
          {quickActions.length > 0 && filters.status === 'active' && !filters.quickOnly && (
            <p className="text-sm text-dark-500 font-medium pt-2">Other Actions</p>
          )}
          <AnimatePresence mode="popLayout">
            {(filters.quickOnly ? actions : regularActions).map((action) => (
              <motion.div
                key={action._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                <ActionItem
                  action={action}
                  onUpdate={handleUpdate}
                  onClick={() => onActionClick?.(action)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

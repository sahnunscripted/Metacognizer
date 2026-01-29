import { useState, useEffect } from 'react';
import { Button, Input, Select } from '../../common';
import { actionsApi, projectsApi, recurringActionsApi } from '../../../services/api';
import { useCelebration } from '../../../context/CelebrationContext';
import { useStats } from '../../../context/StatsContext';
import { useOnboarding } from '../../../context/OnboardingContext';

const CONTEXTS = [
  { value: '@anywhere', label: '@anywhere - Do it anywhere' },
  { value: '@phone', label: '@phone - Need phone calls' },
  { value: '@computer', label: '@computer - Need computer' },
  { value: '@office', label: '@office - At work only' },
  { value: '@errands', label: '@errands - Out and about' },
  { value: '@home', label: '@home - At home' },
  { value: '@waiting', label: '@waiting - Waiting for someone' },
  { value: '@beanetics', label: '@beanetics - Beanetics' },
  { value: '@cafe', label: '@cafe - Cafe' }
];

const PRIORITIES = [
  { value: '1', label: 'Highest' },
  { value: '2', label: 'High' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Low' },
  { value: '5', label: 'Lowest' }
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActionForm({
  action = null,
  projectId = null,
  onSave,
  onCancel
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    context: '@anywhere',
    deadline: '',
    estimatedMinutes: '',
    priority: '3',
    project: projectId || '',
    waitingFor: '',
    status: 'active',
    isRecurring: false,
    daysOfWeek: [],
    recurringEndDate: ''
  });
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [errors, setErrors] = useState({});
  const { celebrate } = useCelebration();
  const { refreshStats } = useStats();
  const { completeMission } = useOnboarding();

  useEffect(() => {
    if (action) {
      setFormData({
        title: action.title || '',
        description: action.description || '',
        context: action.context || '@anywhere',
        deadline: action.deadline ? new Date(action.deadline).toISOString().split('T')[0] : '',
        estimatedMinutes: action.estimatedMinutes?.toString() || '',
        priority: action.priority?.toString() || '3',
        project: action.project?._id || action.project || '',
        waitingFor: action.waitingFor || '',
        status: action.status || 'active',
        isRecurring: false,
        daysOfWeek: [],
        recurringEndDate: ''
      });
    }
  }, [action]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsApi.getAll({ status: 'active' });
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const toggleDay = (dayIndex) => {
    setFormData(prev => {
      const days = prev.daysOfWeek.includes(dayIndex)
        ? prev.daysOfWeek.filter(d => d !== dayIndex)
        : [...prev.daysOfWeek, dayIndex].sort();
      return { ...prev, daysOfWeek: days };
    });
    if (errors.daysOfWeek) {
      setErrors(prev => ({ ...prev, daysOfWeek: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (formData.isRecurring) {
      if (formData.daysOfWeek.length === 0) {
        newErrors.daysOfWeek = 'Select at least one day';
      }
      if (!formData.recurringEndDate) {
        newErrors.recurringEndDate = 'End date is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (formData.isRecurring && !action) {
        const recurringData = {
          title: formData.title,
          description: formData.description,
          context: formData.context,
          priority: parseInt(formData.priority),
          estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : null,
          project: formData.project || null,
          daysOfWeek: formData.daysOfWeek,
          endDate: formData.recurringEndDate
        };

        await recurringActionsApi.create(recurringData);
        onSave?.();
      } else {
        // Determine status based on context, but preserve completed status
        let status = formData.status;
        if (status !== 'completed') {
          status = formData.context === '@waiting' ? 'waiting' : 'active';
        }

        const data = {
          ...formData,
          priority: parseInt(formData.priority),
          estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : null,
          deadline: formData.deadline || null,
          project: formData.project || null,
          waitingFor: formData.context === '@waiting' ? formData.waitingFor : null,
          status
        };

        // Clean recurring fields from regular action data
        delete data.isRecurring;
        delete data.daysOfWeek;
        delete data.recurringEndDate;

        let response;
        if (action) {
          response = await actionsApi.update(action._id, data);
        } else {
          response = await actionsApi.create(data);
        }

        onSave?.(response.data);
      }
    } catch (error) {
      console.error('Failed to save action:', error);
      setErrors({ submit: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!action || completing) return;

    setCompleting(true);
    try {
      const response = await actionsApi.complete(action._id);
      const { pointsAwarded } = response.data;

      celebrate(
        action.isQuickAction ? 'quickAction' : 'action',
        pointsAwarded,
        `+${pointsAwarded} points!`
      );

      refreshStats();
      completeMission('action');
      onSave?.(response.data.action);
    } catch (error) {
      console.error('Failed to complete action:', error);
      setErrors({ submit: 'Failed to complete. Please try again.' });
    } finally {
      setCompleting(false);
    }
  };

  const isQuickAction = formData.estimatedMinutes && parseInt(formData.estimatedMinutes) <= 2;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="What's the next physical action?"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="e.g., Email John about the report"
        error={errors.title}
        autoFocus
      />

      <Input
        label="Description (optional)"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Add any additional details..."
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Select
            label="Context"
            name="context"
            value={formData.context}
            onChange={handleChange}
            options={CONTEXTS}
          />
        </div>

        <Select
          label="Priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          options={PRIORITIES}
        />
      </div>

      {formData.context === '@waiting' && (
        <Input
          label="Waiting for whom?"
          name="waitingFor"
          value={formData.waitingFor}
          onChange={handleChange}
          placeholder="e.g., John to reply"
        />
      )}

      {/* Recurring action toggle - only when creating new actions */}
      {!action && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                isRecurring: e.target.checked,
                deadline: e.target.checked ? '' : prev.deadline
              }))}
              className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-primary-500"
            />
            Repeat this action on specific days
          </label>

          {formData.isRecurring && (
            <>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  Repeat on
                </label>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((label, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`
                        w-10 h-10 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${formData.daysOfWeek.includes(index)
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.daysOfWeek && (
                  <p className="text-xs text-danger-400 mt-1">{errors.daysOfWeek}</p>
                )}
              </div>

              <Input
                label="Repeat until"
                name="recurringEndDate"
                type="date"
                value={formData.recurringEndDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                error={errors.recurringEndDate}
              />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!formData.isRecurring && (
          <Input
            label="Deadline (optional)"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
          />
        )}

        <div className={formData.isRecurring ? 'sm:col-span-2' : ''}>
          <Input
            label="Est. minutes (optional)"
            name="estimatedMinutes"
            type="number"
            value={formData.estimatedMinutes}
            onChange={handleChange}
            placeholder="e.g., 15"
            min="1"
          />
          {isQuickAction && (
            <p className="text-xs text-success-400 mt-1">
              Quick action! (2-minute rule)
            </p>
          )}
        </div>
      </div>

      {!projectId && (
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
      )}

      {errors.submit && (
        <p className="text-sm text-danger-400">{errors.submit}</p>
      )}

      {/* Mark Complete Button - only show when editing an incomplete action */}
      {action && action.status !== 'completed' && (
        <Button
          type="button"
          variant="success"
          fullWidth
          loading={completing}
          onClick={handleComplete}
        >
          Mark Complete
        </Button>
      )}

      {action && action.status === 'completed' && (
        <p className="text-sm text-success-400 text-center py-2">
          This action has been completed
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={saving}
          className="flex-1"
        >
          {action ? 'Update Action' : formData.isRecurring ? 'Create Recurring Action' : 'Create Action'}
        </Button>
      </div>
    </form>
  );
}

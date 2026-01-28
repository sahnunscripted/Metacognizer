import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ActionList from '../../components/actions/ActionList/ActionList';
import ActionForm from '../../components/actions/ActionForm/ActionForm';
import PointsDisplay from '../../components/rewards/PointsDisplay/PointsDisplay';
import GettingStartedCard from '../../components/onboarding/GettingStartedCard';
import { Button, Modal, Card } from '../../components/common';

const quickNavItems = [
  {
    to: '/projects',
    label: 'Projects',
    color: 'text-primary-400',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    )
  },
  {
    to: '/braindump',
    label: 'Brain Dump',
    color: 'text-warning-400',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  {
    to: '/inbasket',
    label: 'Inbox',
    color: 'text-success-400',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    )
  }
];

export default function HomePage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleSave = () => {
    setShowForm(false);
    setSelectedAction(null);
    setRefreshKey(k => k + 1);
  };

  const handleActionClick = (action) => {
    setSelectedAction(action);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <PointsDisplay />
      </motion.div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-3 gap-2">
        {quickNavItems.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              onClick={() => navigate(item.to)}
              className="w-full flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-dark-800 border border-dark-700 hover:bg-dark-700 transition-all duration-200 active:scale-95"
            >
              <span className={item.color}>{item.icon}</span>
              <span className="text-xs font-medium text-dark-300">{item.label}</span>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Getting Started Missions */}
      <GettingStartedCard />

      {/* Quick Add Section */}
      <Card variant="glass" padding="sm">
        <Button
          onClick={() => {
            setSelectedAction(null);
            setShowForm(true);
          }}
          variant="ghost"
          fullWidth
          className="justify-start text-dark-400 hover:text-dark-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add next action...
        </Button>
      </Card>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark-100">Next Actions</h2>
      </div>

      {/* Actions List */}
      <ActionList
        key={refreshKey}
        onActionClick={handleActionClick}
      />

      {/* Action Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedAction(null);
        }}
        title={selectedAction ? 'Edit Action' : 'New Action'}
        size="lg"
      >
        <ActionForm
          action={selectedAction}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setSelectedAction(null);
          }}
        />
      </Modal>
    </div>
  );
}

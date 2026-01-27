import { useState } from 'react';
import { motion } from 'framer-motion';
import ActionList from '../../components/actions/ActionList/ActionList';
import ActionForm from '../../components/actions/ActionForm/ActionForm';
import PointsDisplay from '../../components/rewards/PointsDisplay/PointsDisplay';
import { Button, Modal, Card } from '../../components/common';

export default function HomePage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

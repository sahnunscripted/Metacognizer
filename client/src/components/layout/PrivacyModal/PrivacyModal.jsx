import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from '../../common';
import { accountApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export default function PrivacyModal({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await accountApi.exportData();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'metacognizer-data-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await accountApi.deleteAccount();
      logout();
      navigate('/auth');
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy & Data" size="md">
      <div className="space-y-6">
        {/* Privacy Statement */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-dark-100">Your Privacy</h3>
          <div className="text-sm text-dark-400 space-y-2">
            <p>Your data is encrypted in transit using TLS 1.2+, scoped exclusively to your account, and we have no admin tools to view user data.</p>
            <p>We collect only what's necessary to provide the service: your email, and the tasks/projects you create.</p>
          </div>
        </div>

        {/* GDPR Rights */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-dark-100">Your Rights</h3>

          {/* Export Data */}
          <div className="bg-dark-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-200">Export Your Data</p>
                <p className="text-xs text-dark-500">Download a copy of all your data as JSON</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportData}
                loading={exporting}
              >
                Export
              </Button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-dark-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-dark-200">Delete Account</p>
                <p className="text-xs text-dark-500">Permanently delete your account and all data</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            </div>

            {showDeleteConfirm && (
              <div className="mt-3 pt-3 border-t border-dark-700 space-y-3">
                <p className="text-sm text-danger-400">
                  This will permanently delete your account and all your data. This cannot be undone.
                </p>
                <div className="space-y-2">
                  <label className="text-xs text-dark-500">
                    Type DELETE to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-dark-100 text-sm focus:outline-none focus:border-danger-500"
                    placeholder="DELETE"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteAccount}
                    loading={deleting}
                    disabled={deleteConfirmText !== 'DELETE'}
                    className="flex-1"
                  >
                    Delete Forever
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="text-xs text-dark-500 text-center pt-2 border-t border-dark-700">
          Questions? Contact us at{' '}
          <a href="mailto:sahnunhm@gmail.com" className="text-dark-400 hover:text-dark-300 underline">
            sahnunhm@gmail.com
          </a>
        </div>
      </div>
    </Modal>
  );
}

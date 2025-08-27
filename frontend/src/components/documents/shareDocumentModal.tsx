import React, { useState } from 'react';
import { useDocumentStore } from '@/stores/documentStore'; // Corrected path
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Permission  } from '@/types/document';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  documentTitle: string;
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<Permission>(Permission.VIEW);
  const [isSharing, setIsSharing] = useState(false);
  
  // Assuming your store has shareDocument, isLoading, and error properties
  const { shareDocument, error, clearError } = useDocumentStore(); 

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSharing(true);
    try {
      await shareDocument(documentId, { email, permission });
      // Success!
      onClose(); 
      setEmail('');
      setPermission(Permission.VIEW);
    } catch (err) {
      // Error is handled and displayed by the store
      console.error("Failed to share document:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    clearError(); // Clear any previous errors when closing
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Share Document</h3>
              <p className="text-sm text-gray-500 truncate">Sharing: {documentTitle}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Share Form */}
          <form onSubmit={handleShare}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="user@example.com"
                autoFocus
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="permission" className="block text-sm font-medium text-gray-700 mb-2">
                Permission
              </label>
              <select
                id="permission"
                value={permission}
                onChange={(e) => setPermission(e.target.value as Permission)}
                className="input"
              >
                <option value={Permission.VIEW}>Can View</option>
                <option value={Permission.EDIT}>Can Edit</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSharing || !email.trim()}
                className="btn btn-primary"
              >
                {isSharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentModal;

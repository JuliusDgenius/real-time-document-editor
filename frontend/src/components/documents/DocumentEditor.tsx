import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentStore } from '@/stores/documentStore';
import { ArrowLeftIcon, DocumentArrowDownIcon, ShareIcon } from '@heroicons/react/24/outline';


const DocumentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const documentId = parseInt(id!);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { 
    currentDocument, 
    isLoading, 
    error, 
    getDocument, 
    updateDocument
  } = useDocumentStore();

  useEffect(() => {
    if (documentId) {
      getDocument(documentId);
    }
  }, [documentId, getDocument]);

  useEffect(() => {
    if (currentDocument) {
      setTitle(currentDocument.title);
      setContent(currentDocument.content);
      setHasUnsavedChanges(false);
    }
  }, [currentDocument]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!currentDocument || !hasUnsavedChanges) return;

    try {
      await updateDocument(documentId, {
        title,
        content,
        version: currentDocument.version,
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/documents');
      }
    } else {
      navigate('/documents');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
        <button
          onClick={() => navigate('/documents')}
          className="btn btn-primary"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  if (!currentDocument) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-lg font-medium mb-4">Document not found</div>
        <button
          onClick={() => navigate('/documents')}
          className="btn btn-primary"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Document</h1>
            <p className="text-sm text-gray-500">
              Last modified: {new Date(currentDocument.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              // TODO: Implement share functionality
            }}
            className="btn btn-outline"
          >
            <ShareIcon className="h-4 w-4 mr-2" />
            Share
          </button>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="btn btn-primary"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Save
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="space-y-6">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Document Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            className="input text-xl font-semibold"
            placeholder="Enter document title"
          />
        </div>

        {/* Content Editor */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            className="input min-h-[500px] resize-none font-mono text-sm"
            placeholder="Start writing your document..."
          />
        </div>
      </div>

      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-800">You have unsaved changes</span>
            <button
              onClick={handleSave}
              className="btn btn-primary btn-sm"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;

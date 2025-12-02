'use client';

import { useState } from 'react';

interface DeleteButtonProps {
  entryId: string;
  onDelete?: () => void;
  isDarkMode?: boolean;
}

export function DeleteButton({ entryId, onDelete, isDarkMode = false }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Prevent event bubbling
    
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log('Deleting entry:', entryId);
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Delete response:', response.status, response.statusText);
      
      if (response.ok) {
        // Entry deleted successfully
        console.log('Entry deleted successfully');
        onDelete?.();
      } else {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || 'Unknown server error';
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('Failed to delete entry:', response.status, errorMessage);
        alert(`Failed to delete entry: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <div className="relative">
      {!showConfirm ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowConfirm(true);
          }}
          className={`inline-flex items-center p-2 rounded-md transition-colors ${
            isDarkMode 
              ? 'text-red-400 hover:text-red-300 hover:bg-red-900/50' 
              : 'text-red-600 hover:text-red-800 hover:bg-red-50'
          }`}
          title="Delete entry"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      ) : (
        <div className={`absolute right-0 top-0 z-10 border rounded-md shadow-lg p-3 min-w-[160px] ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <p className={`text-sm mb-3 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>Delete this entry?</p>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCancel();
              }}
              disabled={isDeleting}
              className={`flex-1 px-2 py-1 text-xs border rounded ${isDeleting ? 'opacity-50' : ''} ${
                isDarkMode
                  ? 'border-gray-600 text-gray-200 hover:bg-gray-700/50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleDelete(e);
              }}
              disabled={isDeleting}
              className={`flex-1 px-2 py-1 text-xs border rounded ${isDeleting ? 'opacity-50' : ''} ${isDarkMode ? 'border-red-700 text-red-400 hover:bg-red-900/50' : 'border-red-300 text-red-700 hover:bg-red-50'}`}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

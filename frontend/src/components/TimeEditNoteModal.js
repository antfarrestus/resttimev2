import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const TimeEditNoteModal = ({ isOpen, onClose, onSave, originalTime, fieldName, darkMode }) => {
  const [note, setNote] = useState('');

  // Reset note when modal opens with a new edit
  useEffect(() => {
    if (isOpen) {
      setNote(originalTime || '');
    }
  }, [isOpen, originalTime]);  

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(note);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-full max-w-md p-6 rounded-lg shadow-lg ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Note for Time Edit</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}
              rows="4"
              placeholder="Enter a note about this time edit"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200' }`}
            >
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeEditNoteModal;
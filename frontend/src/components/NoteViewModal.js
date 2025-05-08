// src/components/NoteViewModal.js
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const NoteViewModal = ({ isOpen, noteText, onClose, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    onClick={onClose}>
      <div className={`w-full max-w-md p-6 rounded-lg shadow-lg ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Edit Note</h3>
          <button
              onClick={onClose}
              className={`p-2 rounded-full ${darkMode ? 'bg-slate-400 bg-opacity-10 hover:bg-opacity-20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
              <XMarkIcon className="h-4 w-4" />
            </button>
        </div>
        <p className="whitespace-pre-wrap">{noteText}</p>
      </div>
    </div>
  );
};

export default NoteViewModal;

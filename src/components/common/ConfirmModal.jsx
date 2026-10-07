import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false
}) => {
  // We can reuse the Modal component structure here for confirmation dialogs.
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white border border-zinc-200 rounded-xl max-w-md w-full shadow-xl flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        <p className="text-sm text-zinc-600 mt-2">{description}</p>
        
        <div className="flex justify-end gap-3 pt-6">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 flex items-center justify-center
              ${isDestructive 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600' 
                : 'bg-zinc-900 hover:bg-zinc-800 focus:ring-zinc-900'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

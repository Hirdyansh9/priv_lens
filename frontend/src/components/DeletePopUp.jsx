import React from "react";
import { AlertTriangle, X } from "lucide-react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, chatTitle }) => {
  // Don't render the modal if it's not open
  if (!isOpen) return null;

  return (
    // Backdrop for the modal
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
      {/* Modal Panel */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle
              className="h-6 w-6 text-red-600"
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
            <h3
              className="text-lg leading-6 font-bold text-neutral-900"
              id="modal-title"
            >
              Delete Chat
            </h3>
            <div className="mt-2">
              <p className="text-sm text-neutral-600">
                Are you sure you want to delete this chat?
              </p>
              <p className="text-sm font-semibold text-neutral-800 mt-1 truncate">
                "{chatTitle}"
              </p>
              <p className="text-sm text-neutral-600 mt-2">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
            onClick={onConfirm}
          >
            Delete
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;

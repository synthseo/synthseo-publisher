import { createElement, useEffect } from '@wordpress/element';
import classNames from 'classnames';

const Modal = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  ...props
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-xl',
    xl: 'sm:max-w-2xl',
    full: 'sm:max-w-full sm:m-6',
  };

  const modalClasses = classNames(
    'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full',
    sizeClasses[size],
    className
  );

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createElement(
    'div',
    {
      className: 'fixed inset-0 z-50 overflow-y-auto',
      'aria-labelledby': 'modal-title',
      role: 'dialog',
      'aria-modal': 'true',
    },
    <>
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <div className={modalClasses} {...props}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                {title && (
                  <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    className="ml-auto rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Modal;
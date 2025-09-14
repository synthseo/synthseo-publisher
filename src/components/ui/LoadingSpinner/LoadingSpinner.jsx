import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  inline = false,
  overlay = false,
  text = '',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    current: 'text-current',
  };
  
  const spinnerClasses = classNames(
    'animate-spin',
    sizeClasses[size],
    colorClasses[color]
  );
  
  const Spinner = () => (
    <svg
      className={spinnerClasses}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
  
  if (overlay) {
    return createElement(
      'div',
      {
        className: classNames(
          'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50',
          className
        ),
        ...props,
      },
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex flex-col items-center">
          <Spinner />
          {text && (
            <p className="mt-4 text-sm text-gray-600">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  if (inline) {
    return createElement(
      'span',
      {
        className: classNames('inline-flex items-center', className),
        ...props,
      },
      <>
        <Spinner />
        {text && (
          <span className="ml-2 text-sm">
            {text}
          </span>
        )}
      </>
    );
  }
  
  return createElement(
    'div',
    {
      className: classNames('flex flex-col items-center justify-center', className),
      ...props,
    },
    <>
      <Spinner />
      {text && (
        <p className="mt-4 text-sm text-gray-600">
          {text}
        </p>
      )}
    </>
  );
};

export default LoadingSpinner;
import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const Toggle = ({
  label = '',
  id,
  name,
  checked,
  onChange,
  description = '',
  error = '',
  required = false,
  disabled = false,
  size = 'md',
  className = '',
  toggleClassName = '',
  ...props
}) => {
  const sizeClasses = {
    sm: {
      toggle: 'h-5 w-9',
      dot: 'h-4 w-4',
      translate: 'translate-x-4',
    },
    md: {
      toggle: 'h-6 w-11',
      dot: 'h-5 w-5',
      translate: 'translate-x-5',
    },
    lg: {
      toggle: 'h-7 w-14',
      dot: 'h-6 w-6',
      translate: 'translate-x-7',
    },
  };

  const labelSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const baseToggleClasses = 'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  
  const stateClasses = checked
    ? 'bg-blue-600'
    : 'bg-gray-200';
  
  const disabledClasses = disabled
    ? 'cursor-not-allowed opacity-50'
    : '';

  const toggleClasses = classNames(
    baseToggleClasses,
    sizeClasses[size].toggle,
    stateClasses,
    disabledClasses,
    toggleClassName
  );

  const dotClasses = classNames(
    'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
    sizeClasses[size].dot,
    checked ? sizeClasses[size].translate : 'translate-x-0'
  );

  const wrapperClasses = classNames('', className);

  const toggleId = id || name || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return createElement(
    'div',
    { className: wrapperClasses },
    <>
      <div className="flex items-start">
        <button
          type="button"
          id={toggleId}
          name={name}
          role="switch"
          aria-checked={checked}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${toggleId}-error` : description ? `${toggleId}-description` : undefined
          }
          disabled={disabled}
          onClick={() => onChange && onChange({ target: { checked: !checked, name } })}
          className={toggleClasses}
          {...props}
        >
          <span className="sr-only">
            {label || 'Toggle'}
          </span>
          <span className={dotClasses} />
        </button>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={toggleId}
                className={classNames(
                  'font-medium text-gray-700',
                  labelSizeClasses[size],
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                )}
                onClick={() => !disabled && onChange && onChange({ target: { checked: !checked, name } })}
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {description && (
              <p id={`${toggleId}-description`} className="text-sm text-gray-500 mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
      {error && (
        <p id={`${toggleId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
};

export default Toggle;
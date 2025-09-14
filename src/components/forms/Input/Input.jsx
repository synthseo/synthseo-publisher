import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const Input = ({
  type = 'text',
  label = '',
  id,
  name,
  value,
  onChange,
  placeholder = '',
  error = '',
  helpText = '',
  required = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  icon = null,
  iconPosition = 'left',
  className = '',
  inputClassName = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const baseInputClasses = 'block w-full rounded-md border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0';
  
  const stateClasses = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500';
  
  const disabledClasses = disabled || readOnly
    ? 'bg-gray-50 cursor-not-allowed opacity-75'
    : 'bg-white';

  const inputClasses = classNames(
    baseInputClasses,
    sizeClasses[size],
    stateClasses,
    disabledClasses,
    {
      'pl-10': icon && iconPosition === 'left',
      'pr-10': icon && iconPosition === 'right',
    },
    inputClassName
  );

  const wrapperClasses = classNames('', className);

  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  return createElement(
    'div',
    { className: wrapperClasses },
    <>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">
              {icon}
            </span>
          </div>
        )}
        <input
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
          }
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">
              {icon}
            </span>
          </div>
        )}
      </div>
      {helpText && !error && (
        <p id={`${inputId}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
};

export default Input;
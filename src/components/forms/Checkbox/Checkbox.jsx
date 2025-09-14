import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const Checkbox = ({
  label = '',
  id,
  name,
  checked,
  onChange,
  value,
  error = '',
  helpText = '',
  required = false,
  disabled = false,
  indeterminate = false,
  size = 'md',
  className = '',
  checkboxClassName = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const labelSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const baseCheckboxClasses = 'rounded border-gray-300 text-blue-600 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0';
  
  const stateClasses = error
    ? 'border-red-300 text-red-600 focus:border-red-500 focus:ring-red-500'
    : '';
  
  const disabledClasses = disabled
    ? 'cursor-not-allowed opacity-50'
    : 'cursor-pointer';

  const checkboxClasses = classNames(
    baseCheckboxClasses,
    sizeClasses[size],
    stateClasses,
    disabledClasses,
    checkboxClassName
  );

  const wrapperClasses = classNames('', className);

  const checkboxId = id || name || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return createElement(
    'div',
    { className: wrapperClasses },
    <>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            id={checkboxId}
            name={name}
            checked={checked}
            onChange={onChange}
            value={value}
            required={required}
            disabled={disabled}
            className={checkboxClasses}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${checkboxId}-error` : helpText ? `${checkboxId}-help` : undefined
            }
            ref={(el) => {
              if (el) {
                el.indeterminate = indeterminate;
              }
            }}
            {...props}
          />
        </div>
        {label && (
          <div className="ml-3">
            <label
              htmlFor={checkboxId}
              className={classNames(
                'font-medium text-gray-700',
                labelSizeClasses[size],
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              )}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {helpText && (
              <p id={`${checkboxId}-help`} className="text-sm text-gray-500 mt-0.5">
                {helpText}
              </p>
            )}
          </div>
        )}
      </div>
      {error && (
        <p id={`${checkboxId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
};

export default Checkbox;
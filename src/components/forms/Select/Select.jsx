import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const Select = ({
  label = '',
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = '',
  helpText = '',
  required = false,
  disabled = false,
  multiple = false,
  size = 'md',
  className = '',
  selectClassName = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const baseSelectClasses = 'block w-full rounded-md border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0';
  
  const stateClasses = error
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500';
  
  const disabledClasses = disabled
    ? 'bg-gray-50 cursor-not-allowed opacity-75'
    : 'bg-white';

  const selectClasses = classNames(
    baseSelectClasses,
    sizeClasses[size],
    stateClasses,
    disabledClasses,
    'pr-10',
    selectClassName
  );

  const wrapperClasses = classNames('', className);

  const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

  const renderOptions = () => {
    const optionElements = [];
    
    if (placeholder && !multiple) {
      optionElements.push(
        createElement(
          'option',
          { key: 'placeholder', value: '', disabled: true },
          placeholder
        )
      );
    }

    options.forEach((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        optionElements.push(
          createElement(
            'option',
            { key: option, value: option },
            option
          )
        );
      } else if (option.group) {
        const groupOptions = option.options.map((groupOption) =>
          createElement(
            'option',
            {
              key: groupOption.value,
              value: groupOption.value,
              disabled: groupOption.disabled,
            },
            groupOption.label
          )
        );
        optionElements.push(
          createElement(
            'optgroup',
            { key: option.group, label: option.group },
            groupOptions
          )
        );
      } else {
        optionElements.push(
          createElement(
            'option',
            {
              key: option.value,
              value: option.value,
              disabled: option.disabled,
            },
            option.label
          )
        );
      }
    });

    return optionElements;
  };

  return createElement(
    'div',
    { className: wrapperClasses },
    <>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          multiple={multiple}
          className={selectClasses}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined
          }
          {...props}
        >
          {renderOptions()}
        </select>
        {!multiple && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      {helpText && !error && (
        <p id={`${selectId}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      {error && (
        <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
};

export default Select;
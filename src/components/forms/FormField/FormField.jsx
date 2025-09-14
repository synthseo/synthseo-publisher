import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const FormField = ({
  children,
  label = '',
  error = '',
  helpText = '',
  required = false,
  htmlFor,
  className = '',
  labelClassName = '',
  horizontal = false,
  labelWidth = 'sm:w-1/3',
  ...props
}) => {
  const wrapperClasses = classNames(
    {
      'sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start': horizontal,
    },
    className
  );

  const labelClasses = classNames(
    'block text-sm font-medium text-gray-700',
    {
      'mb-1': !horizontal,
      'sm:mt-px sm:pt-2': horizontal,
      [labelWidth]: horizontal,
    },
    labelClassName
  );

  const contentClasses = horizontal ? 'mt-1 sm:mt-0 sm:col-span-2' : '';

  const fieldId = htmlFor || `field-${Math.random().toString(36).substr(2, 9)}`;

  return createElement(
    'div',
    { className: wrapperClasses, ...props },
    <>
      {label && (
        <label htmlFor={fieldId} className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={contentClasses}>
        {children}
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">
            {helpText}
          </p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </>
  );
};

export default FormField;
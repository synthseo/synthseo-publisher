import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
    purple: 'bg-purple-100 text-purple-800',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  const badgeClasses = classNames(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );
  
  const RemoveButton = () => (
    <button
      type="button"
      onClick={onRemove}
      className={classNames(
        'ml-1 -mr-0.5 inline-flex items-center justify-center rounded-full p-0.5',
        'hover:bg-gray-200 hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-1',
        {
          'focus:ring-gray-400': variant === 'default',
          'focus:ring-blue-400': variant === 'primary',
          'focus:ring-green-400': variant === 'success',
          'focus:ring-yellow-400': variant === 'warning',
          'focus:ring-red-400': variant === 'error',
          'focus:ring-cyan-400': variant === 'info',
          'focus:ring-purple-400': variant === 'purple',
        }
      )}
    >
      <span className="sr-only">Remove</span>
      <svg
        className={classNames({
          'h-3 w-3': size === 'sm',
          'h-3.5 w-3.5': size === 'md',
          'h-4 w-4': size === 'lg',
        })}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
  
  const Dot = () => (
    <svg
      className={classNames('fill-current', {
        'h-1.5 w-1.5': size === 'sm',
        'h-2 w-2': size === 'md',
        'h-2.5 w-2.5': size === 'lg',
      })}
      viewBox="0 0 8 8"
    >
      <circle cx="4" cy="4" r="3" />
    </svg>
  );
  
  return createElement(
    'span',
    {
      className: badgeClasses,
      ...props,
    },
    <>
      {icon && iconPosition === 'left' && (
        <span className={classNames({
          'mr-1': size === 'sm',
          'mr-1.5': size === 'md' || size === 'lg',
        })}>
          {icon === 'dot' ? <Dot /> : icon}
        </span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className={classNames({
          'ml-1': size === 'sm',
          'ml-1.5': size === 'md' || size === 'lg',
        })}>
          {icon === 'dot' ? <Dot /> : icon}
        </span>
      )}
      {removable && onRemove && <RemoveButton />}
    </>
  );
};

export default Badge;
import { createElement, useState } from '@wordpress/element';
import classNames from 'classnames';

const Card = ({
  children,
  className = '',
  title = '',
  subtitle = '',
  headerActions = null,
  footer = null,
  collapsible = false,
  defaultCollapsed = false,
  padding = 'md',
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    none: 'p-0',
  };
  
  const cardClasses = classNames(
    'bg-white rounded-lg border border-gray-200 shadow-sm',
    className
  );
  
  const headerClasses = classNames(
    'border-b border-gray-200',
    paddingClasses[padding]
  );
  
  const bodyClasses = classNames(
    paddingClasses[padding],
    {
      'hidden': collapsible && isCollapsed,
    }
  );
  
  const footerClasses = classNames(
    'border-t border-gray-200 bg-gray-50',
    paddingClasses[padding]
  );
  
  const ChevronIcon = () => (
    <svg
      className={classNames('w-5 h-5 transition-transform', {
        'rotate-180': !isCollapsed,
      })}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
  
  const handleToggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };
  
  return createElement(
    'div',
    {
      className: cardClasses,
      ...props,
    },
    <>
      {(title || subtitle || headerActions || collapsible) && (
        <div className={headerClasses}>
          <div className="flex items-center justify-between">
            <div 
              className={classNames('flex-1', {
                'cursor-pointer': collapsible,
              })}
              onClick={handleToggleCollapse}
            >
              <div className="flex items-center">
                {collapsible && (
                  <span className="mr-2">
                    <ChevronIcon />
                  </span>
                )}
                <div>
                  {title && (
                    <h3 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-600">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {headerActions && (
              <div className="ml-4 flex-shrink-0">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={bodyClasses}>
        {children}
      </div>
      {footer && (
        <div className={footerClasses}>
          {footer}
        </div>
      )}
    </>
  );
};

export default Card;
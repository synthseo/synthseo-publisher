import { createElement, useState } from '@wordpress/element';
import classNames from 'classnames';

const Sidebar = ({
  children,
  isOpen = true,
  onToggle,
  collapsible = true,
  collapsed = false,
  position = 'left',
  width = 'md',
  overlay = false,
  header = null,
  footer = null,
  className = '',
  contentClassName = '',
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const actuallyCollapsed = collapsible ? isCollapsed : false;

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const widthClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
    xl: 'w-96',
    full: 'w-full',
  };

  const collapsedWidth = 'w-16';

  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
  };

  const sidebarClasses = classNames(
    'flex flex-col bg-white border-gray-200 transition-all duration-300 ease-in-out',
    {
      [widthClasses[width]]: !actuallyCollapsed,
      [collapsedWidth]: actuallyCollapsed,
      'fixed top-0 h-full z-40': overlay,
      'relative h-full': !overlay,
      'border-r': position === 'left',
      'border-l': position === 'right',
      'transform -translate-x-full': overlay && !isOpen && position === 'left',
      'transform translate-x-full': overlay && !isOpen && position === 'right',
      'transform translate-x-0': overlay && isOpen,
    },
    positionClasses[position],
    className
  );

  const ToggleButton = () => {
    if (!collapsible) return null;

    return createElement(
      'button',
      {
        onClick: handleToggle,
        className: classNames(
          'p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
          {
            'ml-auto': !actuallyCollapsed,
            'mx-auto': actuallyCollapsed,
          }
        ),
        'aria-label': actuallyCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
      },
      <svg
        className={classNames('w-5 h-5 text-gray-500 transition-transform', {
          'rotate-180': (position === 'left' && !actuallyCollapsed) || (position === 'right' && actuallyCollapsed),
        })}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    );
  };

  const Backdrop = () => {
    if (!overlay || !isOpen) return null;

    return createElement(
      'div',
      {
        className: 'fixed inset-0 bg-gray-500 bg-opacity-75 z-30',
        onClick: () => onToggle && onToggle(false),
        'aria-hidden': 'true',
      }
    );
  };

  return createElement(
    <>
      <Backdrop />
      <aside
        className={sidebarClasses}
        {...props}
      >
        {header && (
          <div className={classNames(
            'p-4 border-b border-gray-200',
            {
              'flex items-center': true,
            }
          )}>
            {!actuallyCollapsed ? header : null}
            <ToggleButton />
          </div>
        )}
        
        {!header && collapsible && (
          <div className="p-4">
            <ToggleButton />
          </div>
        )}
        
        <div className={classNames(
          'flex-1 overflow-y-auto',
          {
            'p-4': !actuallyCollapsed,
            'p-2': actuallyCollapsed,
          },
          contentClassName
        )}>
          {children}
        </div>
        
        {footer && !actuallyCollapsed && (
          <div className="p-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
};

// Sidebar Item component for menu items
export const SidebarItem = ({
  children,
  icon = null,
  active = false,
  collapsed = false,
  onClick,
  href,
  badge = null,
  className = '',
  ...props
}) => {
  const itemClasses = classNames(
    'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors',
    {
      'bg-blue-50 text-blue-700': active,
      'text-gray-700 hover:bg-gray-100 hover:text-gray-900': !active,
      'justify-center': collapsed,
      'justify-between': !collapsed,
    },
    className
  );

  const content = createElement(
    <>
      <div className="flex items-center">
        {icon && (
          <span className={classNames('flex-shrink-0', {
            'mr-3': !collapsed,
          })}>
            {icon}
          </span>
        )}
        {!collapsed && (
          <span className="flex-1">{children}</span>
        )}
      </div>
      {!collapsed && badge && (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return createElement(
      'a',
      {
        href,
        className: itemClasses,
        onClick,
        ...props,
      },
      content
    );
  }

  return createElement(
    'button',
    {
      type: 'button',
      className: itemClasses,
      onClick,
      ...props,
    },
    content
  );
};

export default Sidebar;
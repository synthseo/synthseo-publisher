import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const List = ({
  items = [],
  renderItem,
  itemKey = 'id',
  divided = false,
  hover = false,
  bordered = false,
  compact = false,
  loading = false,
  emptyMessage = 'No items to display',
  emptyIcon = null,
  className = '',
  itemClassName = '',
  ...props
}) => {
  const listClasses = classNames(
    'bg-white',
    {
      'divide-y divide-gray-200': divided,
      'border border-gray-200 rounded-lg': bordered,
      'shadow-sm': bordered,
    },
    className
  );

  const itemClasses = classNames(
    {
      'px-4 py-4': !compact && bordered,
      'px-4 py-2': compact && bordered,
      'py-4': !compact && !bordered,
      'py-2': compact && !bordered,
      'hover:bg-gray-50 transition-colors': hover,
      'first:rounded-t-lg last:rounded-b-lg': bordered,
    },
    itemClassName
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      {emptyIcon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          {emptyIcon}
        </div>
      )}
      <p className="text-sm text-gray-500">{emptyMessage}</p>
    </div>
  );

  const LoadingState = () => (
    <div className="text-center py-12">
      <svg className="animate-spin h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p className="mt-2 text-sm text-gray-500">Loading items...</p>
    </div>
  );

  const DefaultRenderItem = (item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return createElement('span', { className: 'text-gray-900' }, item);
    }
    
    if (item.title || item.label || item.name) {
      const title = item.title || item.label || item.name;
      const description = item.description || item.subtitle || item.text;
      
      return createElement(
        'div',
        { className: 'flex items-center justify-between' },
        <>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {item.action && (
            <div className="ml-4 flex-shrink-0">
              {item.action}
            </div>
          )}
        </>
      );
    }
    
    return createElement('div', { className: 'text-gray-900' }, JSON.stringify(item));
  };

  if (loading) {
    return createElement(
      'div',
      { className: listClasses, ...props },
      <LoadingState />
    );
  }

  if (items.length === 0) {
    return createElement(
      'div',
      { className: listClasses, ...props },
      <EmptyState />
    );
  }

  return createElement(
    'ul',
    { className: listClasses, role: 'list', ...props },
    items.map((item, index) => {
      const key = typeof item === 'object' && item[itemKey] ? item[itemKey] : index;
      
      return createElement(
        'li',
        { key, className: itemClasses },
        renderItem ? renderItem(item, index) : DefaultRenderItem(item)
      );
    })
  );
};

export default List;
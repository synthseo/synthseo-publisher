import { createElement, useState } from '@wordpress/element';
import classNames from 'classnames';

const Table = ({
  columns = [],
  data = [],
  sortable = false,
  filterable = false,
  pagination = false,
  pageSize = 10,
  striped = false,
  hover = false,
  bordered = false,
  compact = false,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  ...props
}) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterValue, setFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (column) => {
    if (!sortable || !column.sortable) return;
    
    if (sortColumn === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  };

  const processedData = () => {
    let result = [...data];

    // Filtering
    if (filterable && filterValue) {
      result = result.filter(row =>
        columns.some(col =>
          String(row[col.key] || '').toLowerCase().includes(filterValue.toLowerCase())
        )
      );
    }

    // Sorting
    if (sortable && sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal > bVal ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Pagination
    if (pagination) {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      result = result.slice(start, end);
    }

    return result;
  };

  const totalPages = Math.ceil(data.length / pageSize);
  const displayData = processedData();

  const tableClasses = classNames(
    'min-w-full divide-y divide-gray-200',
    className
  );

  const thClasses = classNames(
    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
    {
      'cursor-pointer select-none hover:bg-gray-50': sortable,
    }
  );

  const tdClasses = classNames(
    'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
    {
      'py-2': compact,
    }
  );

  const SortIcon = ({ column }) => {
    if (!sortable || !column.sortable) return null;
    
    const isActive = sortColumn === column.key;
    
    return (
      <span className="ml-2 inline-block">
        <svg
          className={classNames('w-4 h-4', {
            'text-gray-400': !isActive,
            'text-gray-700': isActive,
          })}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {!isActive || sortDirection === 'asc' ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          )}
        </svg>
      </span>
    );
  };

  const Pagination = () => {
    if (!pagination || totalPages <= 1) return null;

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={classNames(
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                    currentPage === i + 1
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return createElement(
    'div',
    { className: 'flex flex-col', ...props },
    <>
      {filterable && (
        <div className="mb-4">
          <input
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Search..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      )}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className={tableClasses}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={thClasses}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {column.label}
                    <SortIcon column={column} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={classNames('bg-white divide-y divide-gray-200', {
            'divide-y-0': !bordered,
          })}>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <div className="inline-flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={classNames({
                    'bg-gray-50': striped && rowIndex % 2 === 1,
                    'hover:bg-gray-50': hover,
                  })}
                >
                  {columns.map(column => (
                    <td key={column.key} className={tdClasses}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination />
    </>
  );
};

export default Table;

import React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode); // Can be a key or a function to render custom content
  className?: string; // For <td> styling
  headerClassName?: string; // For <th> styling
  sortable?: boolean;
  sortKey?: string; // Explicit key for sorting, useful when accessor is a function
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index?: number) => string | number;
  onRowClick?: (row: T) => void;
  className?: string;
  sortConfig?: { key: string; direction: 'ascending' | 'descending' } | null;
  requestSort?: (key: string) => void;
}

const Table = <T extends object,>({ columns, data, keyExtractor, onRowClick, className = '', sortConfig, requestSort }: TableProps<T>): React.ReactElement => {
  const getSortKey = (col: Column<T>): string | null => {
      if (col.sortKey) return col.sortKey;
      if (typeof col.accessor === 'string') return String(col.accessor);
      return null;
  }

  return (
    <div className={`overflow-x-auto shadow-custom rounded-lg ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-primary-600 dark:bg-primary-700">
          <tr>
            {columns.map((col, index) => {
              const sortKey = getSortKey(col);
              return (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider ${col.headerClassName || ''} ${col.sortable ? 'cursor-pointer hover:bg-primary-500 dark:hover:bg-primary-600' : ''}`}
                  onClick={() => col.sortable && requestSort && sortKey && requestSort(sortKey)}
                >
                  <div className="flex items-center">
                    <span>{col.header}</span>
                    {col.sortable && sortConfig && sortKey === sortConfig.key && (
                       <span className="mr-2 text-accent-400">
                          {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                        </span>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                داده‌ای برای نمایش وجود ندارد.
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr 
                key={keyExtractor(row, index)} 
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}`}
              >
                {columns.map((col, index) => (
                  <td
                    key={index}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 ${col.className || ''}`}
                  >
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : String((row as any)[col.accessor] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
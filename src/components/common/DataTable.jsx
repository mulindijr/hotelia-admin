import React from 'react';

const DataTable = ({ 
  columns, 
  data, 
  isLoading, 
  emptyStateMessage = "No data found",
  onRowClick,
  pagination = null
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-3 whitespace-nowrap ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-sm text-zinc-900">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-zinc-500">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 text-zinc-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading data...
                  </div>
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-zinc-50/50' : 'hover:bg-zinc-50/30'}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 whitespace-nowrap ${col.cellClassName || ''}`}>
                      {col.accessor ? row[col.accessor] : col.render ? col.render(row) : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-zinc-500">
                  {emptyStateMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      {pagination && (
        <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-sm text-zinc-600">
          <div>
            Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total || 0} results
          </div>
          <div className="flex gap-2">
            <button 
              disabled={!pagination.prev_page_url}
              onClick={() => pagination.onPageChange(pagination.current_page - 1)}
              className="px-3 py-1 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            >
              Previous
            </button>
            <button 
              disabled={!pagination.next_page_url}
              onClick={() => pagination.onPageChange(pagination.current_page + 1)}
              className="px-3 py-1 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

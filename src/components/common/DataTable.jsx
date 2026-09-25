import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

const DataTable = ({ 
  columns, 
  data, 
  isLoading, 
  emptyStateMessage = "No data found",
  onRowClick,
  pagination = null,
  
  // Search & Filters
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters, // React node for custom filter dropdowns
  
  // Per Page
  perPageOptions = [15, 30, 50, 100],
  perPage,
  onPerPageChange,

  // Selection
  enableSelection = false,
  selectedRowIds = [],
  onSelectionChange,
}) => {
  const [localSearch, setLocalSearch] = useState(searchValue || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange && localSearch !== searchValue) {
        onSearchChange(localSearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, searchValue]);

  // Sync external search value
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== localSearch) {
      setLocalSearch(searchValue);
    }
  }, [searchValue]);

  const handleSelectAll = (e) => {
    if (!onSelectionChange || !data) return;
    if (e.target.checked) {
      onSelectionChange(data.map(row => row.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (e, id) => {
    if (!onSelectionChange) return;
    e.stopPropagation(); // prevent row click
    if (e.target.checked) {
      onSelectionChange([...selectedRowIds, id]);
    } else {
      onSelectionChange(selectedRowIds.filter(rowId => rowId !== id));
    }
  };

  const isAllSelected = data && data.length > 0 && selectedRowIds.length === data.length;
  const isIndeterminate = selectedRowIds.length > 0 && selectedRowIds.length < (data?.length || 0);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col w-full">
      
      {/* Table Controls Header */}
      {(onSearchChange || filters) && (
        <div className="p-4 border-b border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Search Bar */}
            {onSearchChange && (
              <div className="relative max-w-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  placeholder={searchPlaceholder || "Search..."}
                  className="block w-full pl-10 pr-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-colors"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                />
              </div>
            )}

            {/* Custom Filters Slot */}
            {filters && (
              <div className="flex items-center gap-2">
                {filters}
              </div>
            )}
          </div>

          {/* Show Entries Dropdown */}
          {onPerPageChange && (
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <span>Show</span>
              <select
                value={perPage || 15}
                onChange={(e) => onPerPageChange(Number(e.target.value))}
                className="border border-zinc-200 rounded-md py-1.5 px-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer"
              >
                {perPageOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span>entries</span>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {enableSelection && (
                <th className="px-6 py-3 whitespace-nowrap w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900 cursor-pointer"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
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
                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="px-6 py-12 text-center text-zinc-500">
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
              data.map((row, rowIndex) => {
                const isSelected = selectedRowIds.includes(row.id);
                return (
                  <tr 
                    key={row.id || rowIndex} 
                    className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${isSelected ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/30'}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {enableSelection && (
                      <td className="px-6 py-4 whitespace-nowrap w-12" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900 cursor-pointer"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(e, row.id)}
                        />
                      </td>
                    )}
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className={`px-6 py-4 whitespace-nowrap ${col.cellClassName || ''}`}>
                        {col.render ? col.render(row) : col.accessor ? row[col.accessor] : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="px-6 py-12 text-center text-zinc-500">
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
            Showing <span className="font-medium text-zinc-900">{pagination.from || 0}</span> to <span className="font-medium text-zinc-900">{pagination.to || 0}</span> of <span className="font-medium text-zinc-900">{pagination.total || 0}</span> results
          </div>
          <div className="flex gap-2">
            <button 
              disabled={!pagination.prev_page_url}
              onClick={() => pagination.onPageChange(pagination.current_page - 1)}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white font-medium transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={!pagination.next_page_url}
              onClick={() => pagination.onPageChange(pagination.current_page + 1)}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white font-medium transition-colors"
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

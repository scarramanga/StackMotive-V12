import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { TagInput } from './TagInput';

interface Column {
  header: string;
  accessorKey: string;
  cell?: (value: any) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns?: Column[];
  isLoading?: boolean;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  // SignalLogPanel-specific props
  expandedRows?: Set<string>;
  onToggleRow?: (id: string) => void;
  onTag?: (id: string, tag: string) => void;
  onAnnotate?: (id: string, note: string) => void;
  anomalyMap?: Record<string, boolean>;
  search?: string;
  timezone?: string;
  locale?: string;
  deepLink?: (id: string) => string;
}

export function DataTable<T extends { id: string; symbol?: string; generatedAt?: string; action?: string; signalStrength?: number; technicalIndicators?: any; status?: string; notes?: string; rebalance?: any; tags?: string[]; annotation?: string }>(
  {
    data,
    columns,
    isLoading = false,
    searchable = false,
    pagination = false,
    pageSize = 10,
    onRowClick,
    expandedRows,
    onToggleRow,
    onTag,
    onAnnotate,
    anomalyMap = {},
    search: searchProp = '',
    timezone = 'UTC',
    locale = 'en-US',
    deepLink,
  }: DataTableProps<T>
) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);

  // Use search prop if provided (SignalLogPanel), else local state
  const search = searchProp || searchQuery;

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    return data.filter((item) => {
      if (columns) {
        return columns.some((column) => {
          const value = (item as any)[column.accessorKey];
          return value?.toString().toLowerCase().includes(search.toLowerCase());
        });
      }
      // SignalLogEntry fields
      return (
        item.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        item.notes?.toLowerCase().includes(search.toLowerCase()) ||
        item.technicalIndicators?.rationale?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [data, search, columns]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return filteredData;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, pagination, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Reset current page when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Row expansion logic
  const isRowExpanded = (id: string) => expandedRows?.has(id);

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns
                ? columns.map((column) => (
                    <TableHead key={column.accessorKey}>{column.header}</TableHead>
                  ))
                : [
                    <TableHead key="expand" aria-label="Expand" />,
                    <TableHead key="symbol">Symbol</TableHead>,
                    <TableHead key="time">Time</TableHead>,
                    <TableHead key="action">Action</TableHead>,
                    <TableHead key="strength">Strength</TableHead>,
                    <TableHead key="status">Status</TableHead>,
                    <TableHead key="deep">Link</TableHead>,
                  ]}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns ? columns.length : 7} className="h-24 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const highlight = anomalyMap[row.id];
                const expanded = isRowExpanded?.(row.id);
                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      onClick={() => onRowClick?.(row)}
                      className={
                        (onRowClick ? 'cursor-pointer hover:bg-muted/50 ' : '') +
                        (highlight ? 'border-l-4 border-red-400 ' : '')
                      }
                      aria-expanded={expanded}
                    >
                      {columns ? (
                        columns.map((column) => (
                          <TableCell key={column.accessorKey}>
                            {column.cell
                              ? column.cell((row as any)[column.accessorKey])
                              : (row as any)[column.accessorKey]}
                          </TableCell>
                        ))
                      ) : (
                        <>
                          <TableCell>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onToggleRow?.(row.id);
                              }}
                              aria-label={expanded ? 'Collapse details' : 'Expand details'}
                              className="text-xs text-blue-600 underline focus:outline-none"
                            >
                              {expanded ? '-' : '+'}
                            </button>
                          </TableCell>
                          <TableCell>{row.symbol}</TableCell>
                          <TableCell>{row.generatedAt ? new Date(row.generatedAt).toLocaleString(locale, { timeZone: timezone }) : ''}</TableCell>
                          <TableCell>{row.action}</TableCell>
                          <TableCell>{typeof row.signalStrength === 'number' ? row.signalStrength.toFixed(2) : ''}</TableCell>
                          <TableCell>{row.status}</TableCell>
                          <TableCell>
                            {deepLink && (
                              <a
                                href={deepLink(row.id)}
                                className="text-xs text-blue-500 underline"
                                aria-label="Copy deep link"
                                tabIndex={0}
                              >🔗</a>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                    {expanded && (
                      <TableRow className="bg-gray-50 dark:bg-gray-900">
                        <TableCell colSpan={columns ? columns.length : 7}>
                          <div className="flex flex-col gap-2">
                            <div className="text-xs text-gray-700 dark:text-gray-200">
                              <b>Rationale:</b> {row.technicalIndicators?.rationale || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-700 dark:text-gray-200">
                              <b>Notes:</b> {row.notes || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-700 dark:text-gray-200">
                              <b>Status:</b> {row.status}
                            </div>
                            <div className="text-xs text-gray-700 dark:text-gray-200">
                              <b>Rebalance:</b> {row.rebalance ? JSON.stringify(row.rebalance) : 'None'}
                            </div>
                            <div className="flex items-center gap-2">
                              <TagInput
                                tags={row.tags || []}
                                onAdd={tag => onTag?.(row.id, tag)}
                                onRemove={tag => onTag?.(row.id, tag)}
                              />
                              <input
                                type="text"
                                className="border rounded px-1 py-0.5 text-xs"
                                placeholder="Add annotation"
                                value={row.annotation || ''}
                                onChange={e => onAnnotate?.(row.id, e.target.value)}
                                aria-label="Add annotation"
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns ? columns.length : 7} className="h-24 text-center">
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} results
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
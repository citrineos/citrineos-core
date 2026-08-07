// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Loader } from '@lib/client/components/ui/loader';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table as TableUi,
} from '@lib/client/components/ui/table';
import { DeleteProvider } from '@lib/providers/table/deleteProvider';
import { type PopoverContentProps } from '@radix-ui/react-popover';
import { type BaseOption, type BaseRecord, type HttpError, useTranslate } from '@refinedev/core';
import { type UseTableProps, type UseTableReturnType, useTable } from '@refinedev/react-table';
import {
  type CellContext,
  type Column,
  type ColumnDef,
  type ColumnDefTemplate,
  type ExpandedState,
  type OnChangeFn,
  type Row,
  type TableOptionsResolved,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';
import React, {
  type FC,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { RowAction, RowActions } from './actions';
import { DeleteAction } from './actions/delete';
import { EditAction } from './actions/edit';
import { ShowAction } from './actions/show';
import {
  TableFilterDateRangePickerFilter,
  TableFilterDropdown,
  TableFilterSearchColumn,
} from './fields';
import { CheckAll } from './fields/checkall';
import { Pagination } from './fields/pagination';
import { SortAction } from './fields/sort';
import { DataTableToolbar } from './toolbar';
import { tableHeaderRowStyle, tableHeaderTextStyle } from '@lib/client/styles/table';
import { parseAsJson, useQueryState } from 'nuqs';
import { TableQueryStateSchema } from '@lib/client/components/table/fields/table-query-state';
import { isNullOrUndefined } from '@lib/utils/assertion';
import { useSelector } from 'react-redux';
import { getPageSizePreference } from '@lib/utils/store/table.preferences.slice';
import { DEFAULT_TABLE_STATE } from '@lib/utils/consts';

export type TableListFilterOption = BaseOption & {
  icon?: React.ComponentType<{ className?: string }>;
};

export type TableFilterProps<TData extends BaseRecord = BaseRecord> = {
  column: Column<TData>;
  title?: string;
  numberOfMonths?: number;
  align?: PopoverContentProps['align'];
  options?: TableListFilterOption[];
};

export type ColumnProps<
  TData extends BaseRecord = BaseRecord,
  TValue = unknown,
  TError extends HttpError = HttpError,
> = {
  id: string;
  accessorKey?: string;
  enableSorting?: boolean;
  enableHiding?: boolean;
  header?:
    | string
    | FC<{
        table: UseTableReturnType<TData, TError>;
      }>;
  cell?: ColumnDefTemplate<CellContext<TData, TValue>>;
  children?: ReactElement;
  filter?: FC<TableFilterProps<TData>>;
};

type CustomColumnDef<
  TData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
> = ColumnDef<TData, TError> & Pick<ColumnProps<TData, TError>, 'filter'>;

export type TableProps<
  TData extends BaseRecord = BaseRecord,
  TError extends HttpError = HttpError,
> = Partial<UseTableProps<TData, TError, TData>> & {
  children?: ReactElement<ColumnProps<TData, TError>>[];
  showHeader?: boolean;
  // Use client-side data instead of server-side fetching
  useClientData?: boolean;
  // New expandable row props
  expandable?: {
    expandedRowRender: (record: TData, index: number) => ReactNode;
    rowExpandable?: (record: TData) => boolean;
    expandedRowKeys?: ExpandedState;
    onExpandedRowsChange?: OnChangeFn<ExpandedState>;
    expandedRowClassName?: string | ((record: TData) => string);
  };
  rowClassName?: string | ((record: TData, index: number) => string);
  onRowClick?: (record: TData) => void;
  showToolbar?: boolean;
  // specific key to track query state with nuqs
  tableStateKey?: string;
};

export function Table<
  TQueryFnData extends BaseRecord = BaseRecord,
  TData extends BaseRecord = TQueryFnData,
  TError extends HttpError = HttpError,
>({
  children,
  showHeader = true,
  columns = [],
  expandable,
  rowClassName,
  onRowClick,
  useClientData = false,
  showToolbar = false,
  tableStateKey = DEFAULT_TABLE_STATE,
  ...props
}: TableProps<TData, TError>) {
  const translate = useTranslate();
  const mapColumn = useCallback(
    ({
      id,
      accessorKey,
      header,
      enableSorting,
      enableHiding,
      filter,
      cell,
    }: ColumnProps<TData, TError>): ColumnDef<TData> => {
      const column: any = {
        id,
        header,
        accessorKey,
        enableSorting: enableSorting ?? false,
        enableHiding: enableHiding ?? false,
        enableColumnFilter: true,
        enableResizing: true,
        filter,
      };

      if (cell) {
        column['cell'] = cell;
      }

      return column;
    },
    [],
  );

  columns = useMemo<ColumnDef<TData>[]>(() => {
    if (Array.isArray(children)) {
      return (children as ReactElement[])
        .map((value: ReactElement) => value.props)
        .map(mapColumn as any);
    }

    return [];
  }, [children, mapColumn]);

  const [tableQueryState, _] = useQueryState(
    tableStateKey,
    parseAsJson(TableQueryStateSchema.parse),
  );

  const pageSizePreference = useSelector((state) => getPageSizePreference(state, tableStateKey));

  // When using client data, we still need to call useTable (React hooks must be called unconditionally)
  // but we configure it to skip the query and use provided data
  const table = useTable({
    columns,
    state: {
      expanded: expandable?.expandedRowKeys,
      pagination: {
        pageIndex: tableQueryState?.page ? tableQueryState.page - 1 : 0,
        pageSize: tableQueryState?.size ?? pageSizePreference,
      },
    },
    onExpandedChange: expandable?.onExpandedRowsChange,
    getRowCanExpand: expandable
      ? (row: Row<TData>) => {
          if (expandable.rowExpandable) {
            return expandable.rowExpandable(row.original);
          }
          return true;
        }
      : undefined,
    getExpandedRowModel: expandable ? getExpandedRowModel() : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: !isNullOrUndefined(tableStateKey),
    // Configure query options to disable fetching when in client mode
    refineCoreProps: useClientData
      ? {
          queryOptions: {
            enabled: false,
          },
        }
      : undefined,
    ...props,
  });

  const reactTable = table.reactTable;
  const tableQuery = useClientData
    ? { isLoading: false, data: props.data }
    : table.refineCore.tableQuery;

  useEffect(() => {
    if (tableQueryState?.sortBy && tableQueryState?.direction) {
      table.refineCore.setSorters([
        {
          field: tableQueryState.sortBy,
          order: tableQueryState.direction,
        },
      ]);
    } else {
      table.refineCore.setSorters(props.refineCoreProps?.sorters?.initial ?? []);
    }
  }, [tableQueryState?.sortBy, tableQueryState?.direction]);

  const tableOptions = useMemo<TableOptionsResolved<TData>>(() => reactTable.options, [reactTable]);

  const isFilterable = useMemo<boolean>(
    () => Boolean(tableOptions.enableColumnFilters || tableOptions?.enableFilters),
    [tableOptions],
  );

  const getRowClassNames = useCallback(
    (record: TData, index: number): string => {
      if (typeof rowClassName === 'function') {
        return rowClassName(record, index);
      }
      return rowClassName || '';
    },
    [rowClassName],
  );

  const getExpandedRowClassNames = useCallback(
    (record: TData): string => {
      if (!expandable?.expandedRowClassName) return '';
      if (typeof expandable.expandedRowClassName === 'function') {
        return expandable.expandedRowClassName(record);
      }
      return expandable.expandedRowClassName;
    },
    [expandable],
  );

  return (
    <DeleteProvider>
      <div className="space-y-4">
        {showToolbar && <DataTableToolbar table={reactTable} />}
        <TableUi>
          {showHeader && (
            <TableHeader className={tableHeaderRowStyle}>
              {reactTable.getHeaderGroups().map((headerGroup: any) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => {
                    const columnDef = header.column.columnDef as CustomColumnDef<TData, TError>;
                    return (
                      <TableHead key={header.id}>
                        <div className={tableHeaderTextStyle}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {!useClientData &&
                            tableOptions.enableSorting &&
                            columnDef.enableSorting && (
                              <SortAction column={header.column} tableStateKey={tableStateKey} />
                            )}
                          {isFilterable &&
                            columnDef?.filter &&
                            (columnDef.filter({
                              column: header.column,
                              title: `${columnDef.header} Filter`,
                            }) as React.ReactNode)}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
          )}
          <TableBody>
            {tableQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-nowrap">
                  <div className="flex items-center justify-center flex-row">
                    <Loader className="h-4 text-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : reactTable.getRowModel().rows?.length ? (
              reactTable.getRowModel().rows.map((row: any, index: number) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={`${getRowClassNames(row.original, index)} ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    id={`table-row-${index}`}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell: any) => (
                      <TableCell key={cell.id} className="text-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandable && row.getIsExpanded() && (
                    <TableRow className={getExpandedRowClassNames(row.original)}>
                      <TableCell colSpan={columns.length} className="p-0">
                        {expandable.expandedRowRender(row.original, index)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {translate('table.noResultsFound', undefined, 'No results found')}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableUi>
        {!useClientData && <Pagination table={reactTable} tableStateKey={tableStateKey} />}
      </div>
    </DeleteProvider>
  );
}

const TableColumn = <TData extends BaseRecord = BaseRecord, TError extends HttpError = HttpError>(
  props: ColumnProps<TData, TError>,
) => {
  return props.children;
};

Table.Column = TableColumn;
Table.CheckAll = CheckAll;
Table.Actions = RowActions;
Table.Action = RowAction;
Table.EditAction = EditAction;
Table.ShowAction = ShowAction;
Table.DeleteAction = DeleteAction;
Table.Filter = {
  DateRangePicker: TableFilterDateRangePickerFilter,
  Dropdown: TableFilterDropdown,
  Search: TableFilterSearchColumn,
};

Table.displayName = 'Table';

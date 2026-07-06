// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Button } from '@lib/client/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lib/client/components/ui/select';
import { type BaseRecord, useTranslate } from '@refinedev/core';
import { type UseTableReturnType } from '@refinedev/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import { parseAsJson, useQueryState } from 'nuqs';
import { TableQueryStateSchema } from '@lib/client/components/table/fields/table-query-state';
import { useDispatch, useSelector } from 'react-redux';
import {
  getPageSizePreference,
  setPageSizePreference,
} from '@lib/utils/store/table.preferences.slice';

interface DataTablePaginationProps<TData extends BaseRecord = BaseRecord> {
  table: UseTableReturnType<TData>['reactTable'];
  showSelectedText?: boolean;
  tableStateKey: string;
}

const MAX_PAGE_SIZE = 50;

export const Pagination = <TData extends BaseRecord = BaseRecord>({
  table,
  showSelectedText,
  tableStateKey,
}: DataTablePaginationProps<TData>) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [tableQueryState, setTableQueryState] = useQueryState(
    tableStateKey,
    parseAsJson(TableQueryStateSchema.parse),
  );
  const pageSizePreference = useSelector((state) => getPageSizePreference(state, tableStateKey));

  const setPage = (pageIndex: number) => {
    // store both page and size in query params for context
    setTableQueryState({
      ...(tableQueryState ?? {}),
      page: pageIndex + 1,
      size: tableQueryState?.size ?? pageSizePreference,
    }).then();
  };

  const setPageSize = (pageSizeString: string) => {
    const pageSize = Number(pageSizeString);

    dispatch(
      setPageSizePreference({
        resource: tableStateKey,
        pageSize,
      }),
    );

    // reset page-related query params after change
    const newParams = { ...(tableQueryState ?? {}) };
    delete newParams.page;
    delete newParams.size;

    setTableQueryState(Object.keys(newParams).length > 0 ? newParams : null).then();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-y-4 sm-gap-y-0 items-center justify-between">
      {showSelectedText && (
        <div className="flex-1 text-sm text-muted-foreground">
          {translate('Common.rowsSelected', {
            selected: table.getFilteredSelectedRowModel().rows.length,
            total: table.getFilteredRowModel().rows.length,
          })}
        </div>
      )}
      <div className="flex relative flex-col-reverse gap-y-4 sm:gap-y-0 sm:flex-row items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">{translate('pagination.rowsPerPage')}</p>
          <Select
            value={`${Math.min(tableQueryState?.size ?? pageSizePreference, MAX_PAGE_SIZE)}`}
            onValueChange={(value) => setPageSize(value)}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, MAX_PAGE_SIZE].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          {translate('Common.pageOf', {
            page: table.getState().pagination.pageIndex + 1,
            total: table.getPageCount(),
          })}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPage(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{translate('pagination.buttons.goToFirstPage')}</span>
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setPage(table.getState().pagination.pageIndex - 1)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{translate('pagination.buttons.goToPreviousPage')}</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setPage(table.getState().pagination.pageIndex + 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{translate('pagination.buttons.goToNextPage')}</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPage(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{translate('pagination.buttons.goToLastPage')}</span>
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

Pagination.displayName = 'Pagination';

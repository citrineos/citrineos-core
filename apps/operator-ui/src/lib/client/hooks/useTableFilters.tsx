// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { type CrudFilter, useTranslate } from '@refinedev/core';
import { parseAsJson, useQueryState } from 'nuqs';
import {
  type FilterItem,
  TableQueryStateSchema,
} from '@lib/client/components/table/fields/table-query-state';
import type { ColumnConfiguration } from '@lib/utils/column.configuration';
import type { ResourceType } from '@lib/utils/access.types';
import { FilterPopover, getFilterLabel } from '@lib/client/components/table/toolbar/filter-popover';
import { X } from 'lucide-react';

/**
 * useTableFilters manages per-table filter state stored in nuqs URL params.
 *
 * Returns:
 * - `filterButton`    – the Filters popover trigger, ready to drop in the toolbar
 * - `filterChips`     – dismissible chip row shown below the toolbar when filters are active
 * - `activeCrudFilters` – CrudFilter[] to pass to refineCoreProps.filters.permanent
 * - `activeFilters`   – raw FilterItem[] (for inspection / testing)
 */
export const useTableFilters = (allColumns: ColumnConfiguration[], resource: ResourceType) => {
  const translate = useTranslate();
  const [tableQueryState, setTableQueryState] = useQueryState(
    resource,
    parseAsJson(TableQueryStateSchema.parse),
  );

  const filterableColumns = allColumns.filter((c) => Boolean(c.filterConfig));
  const activeFilters: FilterItem[] = tableQueryState?.filters ?? [];

  const addFilter = (item: FilterItem) => {
    setTableQueryState((prev) => ({
      ...(prev ?? {}),
      page: 1,
      filters: [...(prev?.filters ?? []), item],
    }));
  };

  const removeFilter = (index: number) => {
    setTableQueryState((prev) => ({
      ...(prev ?? {}),
      page: 1,
      filters: (prev?.filters ?? []).filter((_, i) => i !== index),
    }));
  };

  const clearFilters = () => {
    setTableQueryState((prev) => ({
      ...(prev ?? {}),
      page: 1,
      filters: [],
    }));
  };

  /**
   * Convert stored filter items to Refine CrudFilter format.
   * Boolean fields are converted from string ('true'/'false') to actual booleans,
   * and number fields are converted from string to number, so Hasura receives
   * the correct types in the generated where clause.
   */
  const activeCrudFilters: CrudFilter[] = activeFilters.map((f) => {
    const col = filterableColumns.find((c) => (c.filterConfig?.field ?? c.key) === f.field);
    let value: any = f.value;
    if (col?.filterConfig?.type === 'yesno') {
      value = f.value === 'true';
    } else if (col?.filterConfig?.type === 'number') {
      value = Number(f.value);
    }
    return {
      field: f.field,
      operator: f.op as any,
      value,
    };
  });

  const filterButton = (
    <FilterPopover
      filterableColumns={filterableColumns}
      activeFilters={activeFilters}
      onAdd={addFilter}
      onRemove={removeFilter}
      onClear={clearFilters}
    />
  );

  const filterChips =
    activeFilters.length > 0 ? (
      <div className="flex flex-wrap items-center gap-2 pb-2 pt-1">
        {activeFilters.map((f, i) => {
          const { field, value } = getFilterLabel(f, filterableColumns, translate);
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-0.5 text-xs"
            >
              <span className="font-medium text-foreground">{field}</span>
              <span className="text-muted-foreground">{value}</span>
              <button
                className="rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => removeFilter(i)}
                aria-label={translate('Common.removeFilter', { field })}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={clearFilters}
        >
          {translate('Common.clearAll')}
        </button>
      </div>
    ) : null;

  return {
    filterButton,
    filterChips,
    activeCrudFilters,
    activeFilters,
  };
};

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import type { CellContext } from '@tanstack/react-table';
import { Table } from '@lib/client/components/table';
import type { ColumnConfiguration } from '@lib/utils/column.configuration';
import type { ResourceType } from '@lib/utils/access.types';
import { useDispatch, useSelector } from 'react-redux';
import {
  getVisibleColumnsPreference,
  setVisibleColumnsPreference,
} from '@lib/utils/store/table.preferences.slice';
import { Popover, PopoverContent, PopoverTrigger } from '@lib/client/components/ui/popover';
import { Button } from '@lib/client/components/ui/button';
import { Check, Columns3Cog } from 'lucide-react';
import { buttonIconSize } from '@lib/client/styles/icon';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@lib/client/components/ui/command';
import { cn } from '@lib/utils/cn';
import { useTranslate } from '@refinedev/core';
import { EMPTY_VALUE } from '@lib/utils/consts';

export const ACTIONS_COLUMN = 'actions';

export const convertToTableColumns = (columns: ColumnConfiguration[]) =>
  columns.map((c) => (
    <Table.Column
      id={c.key}
      key={c.key}
      accessorKey={c.accessorKey ?? c.key}
      header={c.header}
      enableSorting={c.sortable}
      cell={(context: CellContext<any, unknown>) =>
        c.cellRender ? (
          c.cellRender(context)
        ) : (
          <span>{context.row.original[c.key] || EMPTY_VALUE}</span>
        )
      }
    />
  ));

/**
 * useColumnPreferences assists with rendering table columns based on
 * preferences stored in redux and changing column visibility.
 *
 * @param allColumns - all available table columns
 * @param resource - the table the columns are related to
 */
export const useColumnPreferences = (allColumns: ColumnConfiguration[], resource: ResourceType) => {
  const dispatch = useDispatch();
  const translate = useTranslate();
  const visibleColumnsPreference = useSelector((state) =>
    getVisibleColumnsPreference(state, resource),
  );

  const finalColumns = visibleColumnsPreference
    ? allColumns.map((ac) => ({
        ...ac,
        visible: visibleColumnsPreference.includes(ac.key),
      }))
    : allColumns;

  const toggleableColumns = finalColumns.filter((fc) => fc.key !== ACTIONS_COLUMN);

  const changeColumnVisibility = (selectedColumn: ColumnConfiguration) => {
    let finalPreferences;
    if (!visibleColumnsPreference) {
      finalPreferences = allColumns
        .filter((ac) => {
          if (ac.key === selectedColumn.key) {
            return !ac.visible;
          } else {
            return ac.visible;
          }
        })
        .map((ac) => ac.key);
    } else {
      if (visibleColumnsPreference.includes(selectedColumn.key)) {
        finalPreferences = visibleColumnsPreference.filter((vcp) => vcp !== selectedColumn.key);
      } else {
        finalPreferences = [...visibleColumnsPreference, selectedColumn.key];
      }
    }

    dispatch(setVisibleColumnsPreference({ resource, columns: finalPreferences }));
  };

  const resetColumnPreferences = () => {
    dispatch(
      setVisibleColumnsPreference({
        resource,
        columns: allColumns.filter((ac) => ac.visible).map((ac) => ac.key),
      }),
    );
  };

  const renderedVisibleColumns = convertToTableColumns(finalColumns.filter((c) => c.visible));

  const columnSelector = (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <Columns3Cog className={buttonIconSize} /> {translate('buttons.columns')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder={translate('Common.searchColumns')} />
          <CommandList>
            <CommandEmpty></CommandEmpty>
            <CommandGroup>
              {toggleableColumns.map((column) => (
                <CommandItem key={column.key} onSelect={() => changeColumnVisibility(column)}>
                  <Check
                    className={cn('mr-2 h-4 w-4', column.visible ? 'opacity-100' : 'opacity-0')}
                  />
                  {column.header}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup className="p-2">
              <Button variant="outline" className="w-full" onClick={resetColumnPreferences}>
                {translate('table.resetColumns')}
              </Button>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return {
    columnSelector,
    renderedVisibleColumns,
  };
};

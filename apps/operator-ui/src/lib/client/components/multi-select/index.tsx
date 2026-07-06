// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Button } from '@lib/client/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@lib/client/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@lib/client/components/ui/popover';
import { cn } from '@lib/utils/cn';
import { useTranslate } from '@refinedev/core';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import React, { type JSX } from 'react';
import { buttonIconSize } from '@lib/client/styles/icon';

export type MultiSelectProps<T> = {
  options: T[];
  selectedValues: T[];
  setSelectedValues: (values: T[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
};

export function MultiSelect<T extends string>({
  options,
  selectedValues,
  setSelectedValues,
  placeholder,
  searchPlaceholder,
}: MultiSelectProps<T>): JSX.Element {
  const translate = useTranslate();
  // Handle null, undefined and single value
  const selectedArray = Array.isArray(selectedValues)
    ? selectedValues
    : selectedValues
      ? [selectedValues as unknown as T]
      : [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative flex gap-2 items-center h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
          <span>
            {selectedArray.length > 0
              ? `${selectedArray.length} ${translate('Common.selected')}`
              : placeholder || translate('Common.selectOptions')}
          </span>
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-0.5">
            {selectedArray.length > 0 && (
              <X
                className={`${buttonIconSize} text-destructive hover:text-destructive/80 cursor-pointer size-4`}
                onClick={() => setSelectedValues([])}
              />
            )}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? translate('Common.searchOptions')} />
          <CommandList>
            <CommandEmpty>{translate('Common.nothingFound')}</CommandEmpty>
            <CommandGroup>
              {options.map((context) => (
                <CommandItem
                  key={context}
                  onSelect={() => {
                    const updatedValues = selectedValues.includes(context)
                      ? selectedValues.filter((c) => c !== context)
                      : [...selectedValues, context];

                    setSelectedValues(updatedValues);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedArray.includes(context) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {context}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface ComboboxProps<T> {
  options: Array<{ label: string; value: T }>;
  value?: T;
  onSelect?: (value: T, label: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  skipValue?: boolean;
  disabled?: boolean;
  allowManualEntry?: boolean;
}

export function Combobox<T>({
  options,
  value,
  onSelect,
  onSearch,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  isLoading = false,
  skipValue = false,
  disabled = false,
  allowManualEntry = false,
}: ComboboxProps<T>) {
  const translate = useTranslate();
  const resolvedPlaceholder = placeholder ?? translate('Common.selectOption');
  const resolvedSearchPlaceholder = searchPlaceholder ?? translate('Common.search');
  const resolvedEmptyMessage = emptyMessage ?? translate('Common.noResults') + '.';
  const [open, setOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<{ label: string; value: T } | undefined>(
    undefined,
  );

  useEffect(() => {
    if (value) {
      const matchingOption = options.find((option) => option.value === value);
      if (matchingOption) {
        setSelectedOption({ ...matchingOption });
      } else if (allowManualEntry && typeof value === 'string') {
        setSelectedOption({ label: value, value });
      } else {
        setSelectedOption(undefined);
      }
    } else {
      setSelectedOption(undefined);
    }
  }, [value, options, allowManualEntry]);

  const trimmedInput = inputValue.trim();
  const showManualEntry =
    allowManualEntry &&
    trimmedInput !== '' &&
    !options.some((o) => o.label.toLowerCase() === trimmedInput.toLowerCase());

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setInputValue('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading || disabled}
        >
          {isLoading
            ? translate('Common.loadingEllipsis')
            : selectedOption?.label || resolvedPlaceholder}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={!onSearch}>
          <CommandInput
            placeholder={resolvedSearchPlaceholder}
            onValueChange={(val) => {
              setInputValue(val);
              onSearch?.(val);
            }}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? translate('Common.loadingEllipsis') : resolvedEmptyMessage}
            </CommandEmpty>
            {showManualEntry && (
              <CommandGroup>
                <CommandItem
                  value={`__manual__${trimmedInput}`}
                  onSelect={() => {
                    const manualOption = {
                      label: trimmedInput,
                      value: trimmedInput as unknown as T,
                    };
                    if (!skipValue) {
                      setSelectedOption(manualOption);
                    }
                    onSelect?.(trimmedInput as unknown as T, trimmedInput);
                    setOpen(false);
                    setInputValue('');
                  }}
                >
                  {translate('Common.useValue', { value: trimmedInput })}
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {options.map((option, index) => (
                <CommandItem
                  key={index}
                  value={String(option.value)}
                  onSelect={() => {
                    if (!skipValue) {
                      setSelectedOption(option);
                    }
                    onSelect?.(option.value, option.label);
                    setOpen(false);
                    setInputValue('');
                  }}
                >
                  <CheckIcon
                    className={cn(
                      'mr-2 size-4',
                      selectedOption?.label === option.label ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

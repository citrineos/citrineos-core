// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Button } from '@lib/client/components/ui/button';
import { Calendar } from '@lib/client/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@lib/client/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { FC } from 'react';
import { type DateRange } from 'react-day-picker';
import { useTranslate } from '@refinedev/core';

export type RangePickerProps = {
  dateRange: DateRange | undefined;
  setDateRange: (r: DateRange) => void;
};

export const RangePicker: FC<RangePickerProps> = ({ dateRange, setDateRange }) => {
  const translate = useTranslate();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
              </>
            ) : (
              format(dateRange.from, 'LLL dd, y')
            )
          ) : (
            translate('Common.pickDateRange')
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
          required
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
};

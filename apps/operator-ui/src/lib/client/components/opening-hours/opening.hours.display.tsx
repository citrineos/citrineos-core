// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Separator } from '@lib/client/components/ui/separator';
import type { LocationHours } from '@citrineos/base';
import { Clock, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { NOT_APPLICABLE } from '@lib/utils/consts';
import { useTranslate } from '@refinedev/core';

interface OpeningHoursDisplayProps {
  openingHours?: LocationHours | null;
}

const WEEKDAY_KEYS = [
  '', // 0 index unused
  'openingHours.weekdays.monday',
  'openingHours.weekdays.tuesday',
  'openingHours.weekdays.wednesday',
  'openingHours.weekdays.thursday',
  'openingHours.weekdays.friday',
  'openingHours.weekdays.saturday',
  'openingHours.weekdays.sunday',
];

export const OpeningHoursDisplay: React.FC<OpeningHoursDisplayProps> = ({ openingHours }) => {
  const translate = useTranslate();
  if (!openingHours) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 py-3">
          <Clock className="h-4 w-4" />
          <span className="font-medium">{translate('openingHours.title')}</span>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{NOT_APPLICABLE}</p>
        </CardContent>
      </Card>
    );
  }

  const { twentyfourSeven, regularHours, exceptionalOpenings, exceptionalClosings } = openingHours;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return format(date, 'h:mm a');
  };

  const formatDateRange = (start: Date | string, end: Date | string) => {
    const startDate = typeof start === 'string' ? parseISO(start) : start;
    const endDate = typeof end === 'string' ? parseISO(end) : end;

    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
      return format(startDate, 'MMM d, yyyy');
    }

    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  // Group regular hours by weekday and sort
  const sortedRegularHours = (regularHours || []).slice().sort((a, b) => a.weekday - b.weekday);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 py-3">
        <Clock className="h-4 w-4" />
        <span className="font-medium">{translate('openingHours.title')}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 24/7 Status */}
        {twentyfourSeven ? (
          <div className="space-y-2">
            <Badge variant="success" className="text-sm px-3 py-1">
              {translate('openingHours.twentyFourSeven')}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {translate('openingHours.twentyFourSevenDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Regular Hours */}
            <div>
              <h4 className="font-medium mb-3">{translate('openingHours.regularHours')}</h4>
              {sortedRegularHours.length > 0 ? (
                <div className="space-y-2">
                  {sortedRegularHours.map((hours, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="font-medium">{translate(WEEKDAY_KEYS[hours.weekday])}</span>
                      <span className="text-muted-foreground">
                        {formatTime(hours.periodBegin)} - {formatTime(hours.periodEnd)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{translate('openingHours.noRegularHours')}</p>
              )}
            </div>
          </div>
        )}

        {/* Exceptional Openings */}
        {(exceptionalOpenings?.length || 0) > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4" />
                <h4 className="font-medium">{translate('openingHours.exceptionalOpenings')}</h4>
              </div>
              <div className="space-y-2">
                {exceptionalOpenings?.map((period, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="default">{translate('openingHours.specialOpening')}</Badge>
                    <span className="text-sm">
                      {formatDateRange(period.periodBegin, period.periodEnd)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Exceptional Closings */}
        {(exceptionalClosings?.length || 0) > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4" />
                <h4 className="font-medium">{translate('openingHours.exceptionalClosings')}</h4>
              </div>
              <div className="space-y-2">
                {exceptionalClosings?.map((period, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="destructive">{translate('openingHours.closed')}</Badge>
                    <span className="text-sm">
                      {formatDateRange(period.periodBegin, period.periodEnd)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

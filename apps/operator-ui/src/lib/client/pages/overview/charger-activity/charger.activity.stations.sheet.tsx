// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lib/client/components/ui/sheet';
import { ChargerRow } from '@lib/client/pages/overview/charger.row';
import type { ChargerStatusEnum } from '@lib/utils/enums';
import { ScrollArea } from '@ferdiunal/refine-shadcn/ui';
import { useTranslate } from '@refinedev/core';

export const ChargerActivityStationsSheet = ({
  open,
  onOpenAction,
  status,
  chargers,
}: {
  open: boolean;
  onOpenAction: () => void;
  status: ChargerStatusEnum;
  chargers: any[];
}) => {
  const translate = useTranslate();

  return (
    <Sheet open={open} onOpenChange={onOpenAction}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {status} {translate('Overview.chargers')}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="overflow-hidden">
          <div className="m-4 mt-0 flex flex-col gap-4">
            {chargers.length > 0 ? (
              chargers.map((item, index) => (
                <ChargerRow
                  key={`${item.station.ocppConnectionName}-${item.evse.connectors?.[0]?.id}`}
                  chargingStation={item.station}
                  evse={item.evse}
                  lastStatus={item.lastStatus}
                  showSeparator={index !== chargers.length - 1}
                />
              ))
            ) : (
              <span>{translate('Overview.noChargersStatus', { status })}</span>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

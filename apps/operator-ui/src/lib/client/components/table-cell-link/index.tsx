// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { type ReactNode } from 'react';
import { clickableLinkStyle } from '@lib/client/styles/page';
import { useRouter } from 'next/navigation';

export const TableCellLink = ({
  path,
  value,
  onPlainClick,
}: {
  path: string;
  value: ReactNode | string;
  onPlainClick?: () => void;
}) => {
  const { push } = useRouter();

  return (
    // `w-fit` keeps the clickable area to the text only, so the surrounding cell space falls through
    // to the row's onClick (e.g. the station preview drawer) instead of navigating.
    <div
      className={`${clickableLinkStyle} w-fit`}
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation();
        // If Ctrl key (or Command key on Mac) is pressed, open in new window/tab
        if (event.ctrlKey || event.metaKey) {
          window.open(path, '_blank');
        } else if (onPlainClick) {
          onPlainClick();
        } else {
          // Default behavior - navigate in current window
          push(path);
        }
      }}
    >
      {value}
    </div>
  );
};

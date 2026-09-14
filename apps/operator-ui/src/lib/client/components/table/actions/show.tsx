// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useGetShowUrl } from '@lib/client/hooks/get-show-url';
import type { RowActionProps } from '.';
import { RowAction } from '.';

type ShowActionProps = RowActionProps & {
  row: any;
  resource: string;
  title: string;
};

export function ShowAction({ row, resource, title, disabled, ...props }: ShowActionProps) {
  const detail = useGetShowUrl(resource, row.id);

  return (
    <RowAction
      {...props}
      disabled={!detail.can || disabled}
      title={!detail?.can ? detail?.reason : title}
      to={detail.url}
    />
  );
}

ShowAction.displayName = 'ShowAction';

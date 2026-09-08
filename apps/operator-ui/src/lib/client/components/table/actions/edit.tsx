// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useGetEditUrl } from '@lib/client/hooks/get-edit-url';
import type { RowActionProps } from '.';
import { RowAction } from '.';

type EditActionProps = RowActionProps & {
  row: any;
  resource: string;
  title: string;
};

export function EditAction({ row, resource, title, disabled, ...props }: EditActionProps) {
  const edit = useGetEditUrl(resource, row.id);

  return (
    <RowAction
      {...props}
      disabled={!edit.can || disabled}
      title={!edit?.can ? edit?.reason : title}
      to={edit.url}
    />
  );
}

EditAction.displayName = 'EditAction';

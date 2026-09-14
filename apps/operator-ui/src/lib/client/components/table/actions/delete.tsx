// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useDeleteHelper } from '@lib/client/hooks/use-delete-helper';
import { DeleteContext } from '@lib/providers/table/delete-provider';
import { useContext } from 'react';
import type { RowActionProps } from '.';
import { RowAction } from '.';

type DeleteActionProps = RowActionProps & {
  row: any;
  resource: string;
  title: string;
  onAfterHandle?: () => void;
};

export function DeleteAction({
  row,
  resource,
  title,
  disabled,
  onAfterHandle,
  ...props
}: DeleteActionProps) {
  const { can, reason } = useDeleteHelper(resource, row.id);
  const deleteContext = useContext(DeleteContext);

  return (
    <RowAction
      {...props}
      disabled={!can || disabled}
      title={!can ? reason : title}
      onClick={() =>
        deleteContext?.updateData({
          row,
          resource,
          toogle: true,
          onAfterHandle,
        })
      }
    />
  );
}

DeleteAction.displayName = 'DeleteAction';

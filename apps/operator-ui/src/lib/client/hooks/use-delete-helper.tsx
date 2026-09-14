// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AccessControlContext,
  type CanReturnType,
  useCan,
  useDelete,
  useMutationMode,
  useResourceParams,
  useTranslate,
  useWarnAboutChange,
} from '@refinedev/core';
import type { MutateOptions } from '@tanstack/react-query';
import { useContext } from 'react';

type DeleteHelperReturnType = CanReturnType & {
  isLoading: boolean;
  mutate: (e?: MutateOptions<unknown, unknown, unknown, unknown>) => any; // TODO: UseDeleteReturnType fix
};

export const useDeleteHelper = (
  resource: string,
  recordItemId: string,
  meta?: any,
): DeleteHelperReturnType => {
  const accessControlContext = useContext(AccessControlContext);

  const accessControlEnabled = accessControlContext.options.buttons.enableAccessControl;

  const hideIfUnauthorized = accessControlContext.options.buttons.hideIfUnauthorized;

  const translate = useTranslate();

  const id = useResourceParams();

  const { resource: _resource, identifier } = useResourceParams({ resource });

  const { mutationMode } = useMutationMode();

  const {
    mutate,
    mutation: { isPending },
  } = useDelete();

  const { data } = useCan({
    resource: _resource?.name,
    action: 'delete',
    params: { id: recordItemId ?? id, resource: _resource },
    queryOptions: {
      enabled: accessControlEnabled,
      queryKey: ['useCan', _resource?.name, 'delete', id],
    },
  });

  const reason = () => {
    if (data?.can) return '';
    else if (data?.reason) return data.reason;
    else return translate('buttons.notAccessTitle');
  };

  const { setWarnWhen } = useWarnAboutChange();

  const onDeleteMutate = (options?: MutateOptions<unknown, unknown, unknown, unknown>): any => {
    if (accessControlEnabled && hideIfUnauthorized && !data?.can) {
      return;
    }
    if ((recordItemId ?? id) && identifier) {
      setWarnWhen(false);
      return mutate(
        {
          id: recordItemId ?? id ?? '',
          resource: identifier,
          mutationMode,
          meta: meta,
        },
        options,
      );
    }

    return undefined;
  };

  return {
    can: !(accessControlEnabled && hideIfUnauthorized && !data?.can),
    reason: reason(),
    mutate: onDeleteMutate,
    isLoading: isPending,
  };
};

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AccessControlContext,
  type CanReturnType,
  useCan,
  useNavigation,
  useResourceParams,
  useTranslate,
} from '@refinedev/core';
import { useContext } from 'react';

type GetEditUrlReturnType = CanReturnType & {
  url: string;
};

export const useGetEditUrl = (
  resource: string,
  recordItemId: string,
  meta?: any,
): GetEditUrlReturnType => {
  const accessControlContext = useContext(AccessControlContext);
  const accessControlEnabled = accessControlContext.options.buttons.enableAccessControl;

  const hideIfUnauthorized = accessControlContext.options.buttons.hideIfUnauthorized;

  const { editUrl: generateEditUrl } = useNavigation();

  const { id, resource: _resource } = useResourceParams({ resource });

  const { data } = useCan({
    resource: resource,
    action: 'edit',
    params: { id: recordItemId, resource: _resource },
    queryOptions: {
      enabled: accessControlEnabled,
      queryKey: ['useCan', _resource?.name, 'edit', id],
    },
  });

  const translate = useTranslate();

  const reason = () => {
    if (data?.can) return '';
    else if (data?.reason) return data.reason;
    else return translate('buttons.notAccessTitle');
  };

  const editUrl =
    resource && (recordItemId ?? id) ? generateEditUrl(resource, recordItemId! ?? id!, meta) : '';

  return {
    can: !(accessControlEnabled && hideIfUnauthorized && !data?.can),
    reason: reason(),
    url: editUrl,
  };
};

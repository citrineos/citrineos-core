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

type GetShowUrlReturnType = CanReturnType & {
  url: string;
};

export const useGetShowUrl = (
  resource: string,
  recordItemId: string,
  meta?: any,
): GetShowUrlReturnType => {
  const accessControlContext = useContext(AccessControlContext);
  const accessControlEnabled = accessControlContext.options.buttons.enableAccessControl;

  const hideIfUnauthorized = accessControlContext.options.buttons.hideIfUnauthorized;

  const { showUrl: generateShowUrl } = useNavigation();

  const { id, resource: _resource } = useResourceParams({ resource });

  const { data } = useCan({
    resource: resource,
    action: 'show',
    params: { id: recordItemId, resource: _resource },
    queryOptions: {
      enabled: accessControlEnabled,
      queryKey: ['useCan', _resource?.name, 'show', id],
    },
  });

  const translate = useTranslate();

  const reason = () => {
    if (data?.can) return '';
    else if (data?.reason) return data.reason;
    else return translate('buttons.notAccessTitle');
  };

  const showUrl =
    resource && (recordItemId || id) ? generateShowUrl(resource, recordItemId! ?? id!, meta) : '';

  return {
    can: !(accessControlEnabled && hideIfUnauthorized && !data?.can),
    reason: reason(),
    url: showUrl,
  };
};

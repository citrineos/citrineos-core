// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

// Fallback component for unauthorized access to routes
import { useTranslate } from '@refinedev/core';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { heading2Style } from '@lib/client/styles/page';

export const AccessDeniedFallback = () => {
  const translate = useTranslate();

  return (
    <div className="flex flex-col gap-2">
      <h2 className={heading2Style}>{translate('accessDenied')}</h2>
      {translate('buttons.notAccessTitle')}
    </div>
  );
};

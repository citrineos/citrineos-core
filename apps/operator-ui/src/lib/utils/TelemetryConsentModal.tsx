// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { useTranslate } from '@refinedev/core';
import { BaseRestClient } from './BaseRestClient';
import type { SystemConfig } from '@citrineos/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lib/client/components/ui/dialog';
import { Button } from '@lib/client/components/ui/button';

let systemConfig: SystemConfig | null = null;
const client = new BaseRestClient(null);

interface TelemetryConsentModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Handle user decision; receives `true` if user accepts, `false` if user rejects */
  onDecision: (agreed: boolean) => void;
}

export async function checkTelemetryConsent(): Promise<boolean | undefined> {
  try {
    const systemConfigRaw = await client.getRaw(`/ocpprouter/systemConfig`);
    systemConfig = systemConfigRaw.data as SystemConfig;
    const telemetryConsent = systemConfig.userPreferences.telemetryConsent;
    if (typeof telemetryConsent === 'boolean') {
      return telemetryConsent;
    }
  } catch (error) {
    console.error('error checking system config', error);
  }
  return undefined;
}

export async function saveTelemetryConsent(telemetryConsent: boolean): Promise<void> {
  if (systemConfig === null) {
    throw new Error('System config not initialized');
  }
  systemConfig.userPreferences.telemetryConsent = telemetryConsent;
  try {
    await client.putRaw(`/ocpprouter/systemConfig`, systemConfig);
  } catch (error) {
    console.error('Error saving telemetry consent', error);
  }
}

/**
 * TelemetryConsentModal
 *
 * Displays a blocking modal to request consent for telemetry.
 */
export const TelemetryConsentModal: React.FC<TelemetryConsentModalProps> = ({
  visible,
  onDecision,
}) => {
  const translate = useTranslate();
  return (
    <Dialog open={visible} onOpenChange={() => {}}>
      <DialogContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{translate('telemetryConsentModal.title')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{translate('telemetryConsentModal.description')}</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => onDecision(false)}>
            {translate('telemetryConsentModal.reject')}
          </Button>
          <Button onClick={() => onDecision(true)}>
            {translate('telemetryConsentModal.accept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

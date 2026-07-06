// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useEffect, useState } from 'react';
import { useTranslate } from '@refinedev/core';
import { Copy, Loader2, Play, HelpCircle } from 'lucide-react';
import { Button } from '@lib/client/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@lib/client/components/ui/dialog';
import { S3_BUCKET_FILE_CONFIG, S3_BUCKET_FILE_CORE_CONFIG } from '@lib/utils/consts';
import config from '@lib/utils/config';
import type { SystemConfig, WebsocketServerConfig } from '@citrineos/base';
import { fetchFileAction } from '@lib/server/actions/file/fetchFileAction';
import { BucketType } from '@lib/utils/enums';
import { useTenantId } from '@lib/client/hooks/useTenantId';

export interface OperatorConfig {
  centralSystem: {
    host: string;
  };
  defaultTenantId: number;
}

// Security profile identifiers. Labels and descriptions are translated via
// the `ChargingStations.connectionModal.securityProfiles.*` i18n keys.
export const SecurityProfiles: number[] = [0, 1, 2, 3];

interface ConnectionModalProps {
  open: boolean;
  onClose: () => void;
  isFirstLogin?: boolean;
}

export const ConnectionModal = ({ open, onClose, isFirstLogin = false }: ConnectionModalProps) => {
  const translate = useTranslate();
  const [coreConfig, setCoreConfig] = useState<SystemConfig | null>(null);
  const [operatorConfig, setOperatorConfig] = useState<OperatorConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHelpContent, setShowHelpContent] = useState(isFirstLogin);

  // Get web server config from core
  useEffect(() => {
    if (open && !coreConfig) {
      setLoading(true);
      fetchFileAction(`${S3_BUCKET_FILE_CORE_CONFIG}`, BucketType.CORE)
        .then((result) => {
          if (result.success) {
            setCoreConfig(result.data);
          } else {
            throw new Error(result.error);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, coreConfig]);

  // Reset help content state when modal opens/closes
  useEffect(() => {
    setShowHelpContent(isFirstLogin);
  }, [open, isFirstLogin]);

  // Get host from operator ui config
  useEffect(() => {
    if (open && !operatorConfig) {
      setLoading(true);
      fetchFileAction(`${S3_BUCKET_FILE_CONFIG}`)
        .then((result) => {
          if (result.success) {
            setOperatorConfig(result.data);
          } else {
            throw new Error(result.error);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, operatorConfig]);

  const host = operatorConfig?.centralSystem?.host;

  const tenantId = useTenantId();

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500); // clear after 1.5s
      })
      .catch(console.error);
  };

  // Group servers by security profile
  const groupedServers: Record<number, WebsocketServerConfig[]> = {};
  const fallbackServers: Record<number, WebsocketServerConfig[]> = {};

  coreConfig?.util?.networkConnection?.websocketServers?.forEach((server) => {
    const serverWithMapping = server as any;

    // Check if server has tenant path mapping and dynamic tenant resolution enabled
    if (serverWithMapping.tenantPathMapping && serverWithMapping.dynamicTenantResolution) {
      const pathMapping = serverWithMapping.tenantPathMapping;
      const hasTenantMapping = Object.values(pathMapping).includes(tenantId);

      if (hasTenantMapping) {
        if (!groupedServers[server.securityProfile]) groupedServers[server.securityProfile] = [];
        groupedServers[server.securityProfile].push(server);
      }
    } else {
      if (!fallbackServers[server.securityProfile]) fallbackServers[server.securityProfile] = [];
      fallbackServers[server.securityProfile].push(server);
    }
  });

  const buildWebsocketUrl = (
    server: WebsocketServerConfig,
    host: string,
    tenantId: number,
  ): string => {
    const protocol = server.securityProfile > 1 ? 'wss' : 'ws';

    const serverWithMapping = server as any;

    // Check if tenant path mapping exists and dynamic tenant resolution is enabled
    if (serverWithMapping.tenantPathMapping && serverWithMapping.dynamicTenantResolution) {
      const pathMapping = serverWithMapping.tenantPathMapping;
      const pathEntry = Object.entries(pathMapping).find(
        ([_, mappedTenantId]) => mappedTenantId === tenantId,
      );
      if (pathEntry) {
        return `${protocol}://${host}:${server.port}/${pathEntry[0]}`;
      } else {
        return `${protocol}://${host}:${server.port}`;
      }
    } else {
      return `${protocol}://${host}:${server.port}`;
    }
  };

  const hasConnections = coreConfig?.util?.networkConnection?.websocketServers?.length && host;

  // Video URL configuration - can be easily replaced via environment variable
  const helpVideoUrl = config.helpVideoUrl;

  const toggleHelpContent = () => {
    setShowHelpContent(!showHelpContent);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="overflow-y-auto w-200 max-h-150! text-wrap">
        <DialogHeader>
          <DialogTitle>
            {showHelpContent
              ? translate('ChargingStations.connectionModal.welcomeTitle')
              : translate('ChargingStations.connectionModal.connectionTitle')}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {showHelpContent
            ? translate('ChargingStations.connectionModal.welcomeDescription')
            : translate('ChargingStations.connectionModal.connectionDescription')}
        </DialogDescription>

        <div className="flex justify-center mb-4">
          <Button variant="outline" onClick={toggleHelpContent} className="flex items-center gap-2">
            {showHelpContent ? (
              <>
                <HelpCircle className="w-4 h-4" />
                {translate('ChargingStations.connectionModal.showConnectionInfo')}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {translate('ChargingStations.connectionModal.showHelpVideo')}
              </>
            )}
          </Button>
        </div>

        {showHelpContent ? (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">
                {translate('ChargingStations.connectionModal.gettingStartedVideo')}
              </h3>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                {helpVideoUrl ? (
                  <video controls className="w-full h-full rounded-lg" poster="/video-poster.jpg">
                    <source src={helpVideoUrl} type="video/mp4" />
                    {translate('ChargingStations.connectionModal.videoNotSupported')}
                  </video>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      {translate('ChargingStations.connectionModal.noVideoAvailable')}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {translate('ChargingStations.connectionModal.videoDescription')}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">
                {translate('ChargingStations.connectionModal.quickSteps')}
              </h3>
              <ol className="space-y-2 text-sm">
                <li>1. {translate('ChargingStations.connectionModal.step1')}</li>
                <li>2. {translate('ChargingStations.connectionModal.step2')}</li>
                <li>3. {translate('ChargingStations.connectionModal.step3')}</li>
                <li>4. {translate('ChargingStations.connectionModal.step4')}</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{translate('ChargingStations.connectionModal.rememberLabel')}</strong>{' '}
                {translate('ChargingStations.connectionModal.rememberText')}
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hasConnections ? (
          <div className="space-y-6">
            {SecurityProfiles.map((profile) => {
              const servers = groupedServers[profile];
              if (!servers?.length) return null;

              return (
                <div key={profile} className="border border-transparent rounded-lg p-3">
                  <h3 className="font-semibold mb-2">
                    {translate(
                      `ChargingStations.connectionModal.securityProfiles.${profile}.label`,
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {translate(
                      `ChargingStations.connectionModal.securityProfiles.${profile}.description`,
                    )}
                  </p>
                  <ul className="space-y-2">
                    {servers.map((s) => {
                      if (!tenantId) return null;
                      const wsUrl = buildWebsocketUrl(s, host, tenantId);
                      return (
                        <li key={s.id} className="border p-2 rounded flex flex-col gap-1">
                          <span className="text-sm mr-2 font-semibold">
                            {s.protocols.join(', ')}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => copyToClipboard(s.id, `${wsUrl}`)}
                            >
                              <Copy className="size-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                              <a
                                href={`${wsUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-secondary underline text-sm hover:text-primary"
                                title={`${wsUrl}`}
                              >
                                {`${wsUrl}`}
                              </a>

                              {/* Copied message */}
                              {copiedId === s.id && (
                                <span className="text-success text-xs">
                                  {translate('ChargingStations.connectionModal.copied')}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <p>{translate('ChargingStations.connectionModal.noWebsocketServers')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

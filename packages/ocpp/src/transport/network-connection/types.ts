// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { WebsocketLifecycleEvent } from '@citrineos/types';
import type { WsRejectReason, WsSendFailureReason } from '../metrics.js';

/**
 * `source` on a websocket lifecycle event, for causes the transport metrics vocabularies
 * (`WsUpgradeResult`, `WsRejectReason`, `WsSendFailureReason`) do not already name.
 */
export const WsEventSource = {
  TlsHandshakeFailed: 'tls_handshake_failed',
  AdminDisconnect: 'admin_disconnect',
  ServerShutdown: 'server_shutdown',
  ReplacedByNewConnection: 'replaced_by_new_connection',
  PongTimeout: 'pong_timeout',
  CacheExpiryFailed: 'cache_expiry_failed',
  FrameError: 'frame_error',
} as const;
export type WsEventSource = (typeof WsEventSource)[keyof typeof WsEventSource];

export type LifecycleEventFields = Omit<WebsocketLifecycleEvent, 'kind' | 'host' | 'timestamp'>;

/** What a close event needs about a socket once its upgrade request is gone. */
export interface SocketInfo {
  serverId: string;
  remoteAddress?: string;
  uri?: string;
}

/** Why we closed a socket, recorded before closing it so the close event can carry the cause. */
export interface CloseContext {
  source: WsEventSource | WsRejectReason | WsSendFailureReason;
  sentCode?: number;
  error?: { message: string; code?: string };
}

// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Namespace, OCPPVersion } from '@citrineos/base';
import { Column, DataType, ForeignKey, Index, Table } from 'sequelize-typescript';
import { BaseModelWithTenant } from './BaseModelWithTenant.js';
import { ChargingStation, Transaction } from '../index.js';

/**
 * Direction of a DataTransfer relative to the CSMS.
 */
export enum DataTransferDirection {
  CP_TO_CSMS = 'CP_TO_CSMS',
  CSMS_TO_CP = 'CSMS_TO_CP',
}

/**
 * How the `data` string field was decoded.
 */
export enum DataTransferEncoding {
  Json = 'json',
  EscapedJson = 'escaped-json',
  Base64Json = 'base64-json',
  Text = 'text',
  Unknown = 'unknown',
}

/**
 * Structured / parsed view of an OCPP DataTransfer message.
 *
 * The raw RPC envelope is already persisted in {@link OCPPMessage} by the router
 * layer; this table is the parsed layer on top. The raw `data` string is kept
 * verbatim in {@link dataRaw} (parsing is best-effort and never throws), and the
 * decoded object — when we could decode it — lands in {@link dataParsed}.
 */
@Table
export class DataTransferData extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = Namespace.DataTransferData;

  @ForeignKey(() => ChargingStation)
  @Index
  @Column(DataType.STRING)
  declare stationId: string;

  /** RPC unique id of the originating message — joins back to {@link OCPPMessage}. */
  @Index
  @Column(DataType.STRING)
  declare ocppMessageId?: string;

  @Column(DataType.STRING)
  declare direction: DataTransferDirection;

  @Column(DataType.STRING)
  declare ocppVersion: OCPPVersion;

  @Index
  @Column(DataType.STRING)
  declare vendorId: string;

  @Index
  @Column(DataType.STRING)
  declare messageId?: string | null;

  /** Exact `data` string as received, untouched. */
  @Column(DataType.TEXT)
  declare dataRaw?: string | null;

  /** Decoded payload, only populated when decoding succeeded. */
  @Column(DataType.JSONB)
  declare dataParsed?: any;

  @Column(DataType.STRING)
  declare dataEncoding: DataTransferEncoding;

  /** Which vendor parser matched, e.g. `wl:vidInfoReport`. Null if none matched. */
  @Column(DataType.STRING)
  declare parser?: string | null;

  /** The DataTransferStatus we returned to the charger. */
  @Column(DataType.STRING)
  declare responseStatus: string;

  /** Data string we sent back in the response, if any. */
  @Column(DataType.TEXT)
  declare responseData?: string | null;

  /** Resolved Transactions.id when the payload carried a transaction reference. */
  @ForeignKey(() => Transaction)
  @Index
  @Column(DataType.INTEGER)
  declare transactionDbId?: number | null;

  /** Extracted vehicle id (e.g. wl `vid`). Null when absent or a placeholder. */
  @Index
  @Column(DataType.STRING)
  declare vid?: string | null;
}

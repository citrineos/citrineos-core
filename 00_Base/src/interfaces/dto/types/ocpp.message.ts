// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import {
  OCPP1_6_CallAction,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '../../../ocpp/rpc/message.js';
import { MessageOrigin } from '../../messages/index.js';

export const CallActionSchema = z.union([z.enum(OCPP1_6_CallAction), z.enum(OCPP2_0_1_CallAction)]);
export const MessageOriginSchema = z.enum(MessageOrigin);
export const OCPPVersionSchema = z.enum(OCPPVersion);

export type CallActionEnumType = z.infer<typeof CallActionSchema>;
export type MessageOriginEnumType = z.infer<typeof MessageOriginSchema>;
export type OCPPVersionEnumType = z.infer<typeof OCPPVersionSchema>;

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MessageOrigin, MessageState } from '@interfaces/messages/internal-types.js';
import { MessageTypeId, OCPP_CallAction, OCPPVersion } from '@ocpp/rpc/message.js';
import { z } from 'zod';

export const CallActionSchema = z.enum(OCPP_CallAction);
export const MessageOriginSchema = z.enum(MessageOrigin);
export const MessageStateSchema = z.enum(MessageState);
export const MessageTypeSchema = z.enum(MessageTypeId);
export const OCPPVersionSchema = z.enum(OCPPVersion);

export type CallActionEnumType = z.infer<typeof CallActionSchema>;
export type MessageOriginEnumType = z.infer<typeof MessageOriginSchema>;
export type MessageTypeEnumType = z.infer<typeof MessageTypeSchema>;
export type OCPPVersionEnumType = z.infer<typeof OCPPVersionSchema>;

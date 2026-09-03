// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

export enum TokenType {
  AD_HOC_USER = 'AD_HOC_USER',
  APP_USER = 'APP_USER',
  OTHER = 'OTHER',
  RFID = 'RFID',
}
export const TokenTypeSchema = z.nativeEnum(TokenType);
export const TokenTypeSchemaName = 'TokenTypeSchema';

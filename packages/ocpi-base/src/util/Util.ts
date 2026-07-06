// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Role } from '../model/Role.js';
import { plainToInstance } from 'class-transformer';
import type { CredentialsRoleDTO } from '../model/DTO/CredentialsRoleDTO.js';
import type { Constructable } from 'typedi';

export const invalidClientCredentialsRoles = (roles: CredentialsRoleDTO[]) =>
  roles.some((role) => role.role !== Role.EMSP);
export const invalidServerCredentialsRoles = (roles: CredentialsRoleDTO[]) =>
  roles.some((role) => role.role !== Role.CPO);

export enum CountryCode {
  US = 'US',
  CA = 'CA',
  MX = 'MX',
}

export const plainToClass = <T>(
  constructor: Constructable<T>,
  plain: T,
  excludeExtraneousValues = true,
): T =>
  plainToInstance(constructor, plain as T, {
    excludeExtraneousValues,
  });

export const base64Encode = (input: string): string => Buffer.from(input).toString('base64');

export const base64Decode = (input: string): string =>
  Buffer.from(input, 'base64').toString('utf-8');

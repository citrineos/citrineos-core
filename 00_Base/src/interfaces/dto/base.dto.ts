// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export interface IBaseDto {
  updatedAt?: Date;
  createdAt?: Date;
}

export enum BaseDtoProps {
  updatedAt = 'updatedAt',
  createdAt = 'createdAt',
}

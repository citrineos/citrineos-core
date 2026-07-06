// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export class UnknownTokenException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownToken';
  }
}

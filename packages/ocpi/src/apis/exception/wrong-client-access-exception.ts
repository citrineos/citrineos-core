// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export class WrongClientAccessException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WrongClientAccess';
  }
}

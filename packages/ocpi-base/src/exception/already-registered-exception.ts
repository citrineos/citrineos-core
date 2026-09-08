// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export class AlreadyRegisteredException extends Error {
  constructor() {
    super('Already registered');
    this.name = 'AlreadyRegisteredException';
  }
}

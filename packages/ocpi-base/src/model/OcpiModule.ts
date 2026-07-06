// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Constructable } from 'typedi';

export abstract class OcpiModule {
  public abstract getController(): Constructable<any>;
}

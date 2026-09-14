// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { getOcpp2Schema } from '@citrineos/base';
import { OCPPVersion } from '@citrineos/types';

export const OCPP2_PROTOCOLS = [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];

export const ocpp2Schema =
  (name: string) =>
  (version: OCPPVersion): object | undefined =>
    version === OCPPVersion.OCPP1_6 ? undefined : getOcpp2Schema(version, name);

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChargingStationUpsert } from '@lib/client/pages/charging-stations/upsert/charging-stations-upsert';
import config from '@lib/utils/config';

export default function NewChargingStationPage() {
  return <ChargingStationUpsert params={{}} allowImageUpload={config.allowImageUpload} />;
}

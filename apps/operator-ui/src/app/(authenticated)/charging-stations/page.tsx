// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChargingStationsList } from '@lib/client/pages/charging-stations/list/charging.stations.list';
import { StationPreviewLayout } from '@lib/client/pages/charging-stations/station.preview.layout';

export default function ListChargingStationPage() {
  return (
    <StationPreviewLayout>
      <ChargingStationsList />
    </StationPreviewLayout>
  );
}

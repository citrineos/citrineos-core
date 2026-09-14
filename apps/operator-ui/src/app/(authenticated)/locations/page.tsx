// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { LocationsList } from '@lib/client/pages/locations/list/locations-list';
import { StationPreviewLayout } from '@lib/client/pages/charging-stations/station-preview-layout';

export default function ListLocationPage() {
  return (
    <StationPreviewLayout>
      <LocationsList />
    </StationPreviewLayout>
  );
}

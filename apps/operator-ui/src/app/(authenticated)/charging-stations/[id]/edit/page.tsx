// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChargingStationUpsert } from '@lib/client/pages/charging-stations/upsert/charging-stations-upsert';
import config from '@lib/utils/config';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditChargingStationPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <ChargingStationUpsert params={{ id: Number(id) }} allowImageUpload={config.allowImageUpload} />
  );
}

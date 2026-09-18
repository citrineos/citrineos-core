// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChargingStationDetail } from '@lib/client/pages/charging-stations/detail/charging-station-detail';

type PageProps = {
  params: Promise<{ ocppConnectionName: string }>;
};

export default async function ShowChargingStationPage({ params }: PageProps) {
  const { ocppConnectionName } = await params;
  return <ChargingStationDetail params={{ ocppConnectionName }} />;
}

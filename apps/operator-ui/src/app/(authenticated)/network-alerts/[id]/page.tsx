// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { NetworkAlertDetail } from '@lib/client/pages/network-alerts/detail/network-alert-detail';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShowNetworkAlertPage({ params }: PageProps) {
  const { id } = await params;
  return <NetworkAlertDetail params={{ id }} />;
}

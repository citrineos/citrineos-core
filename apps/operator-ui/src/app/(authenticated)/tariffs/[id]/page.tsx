// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TariffDetail } from '@lib/client/pages/tariffs/detail/tariff-detail';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShowTariffPage({ params }: PageProps) {
  const { id } = await params;
  return <TariffDetail params={{ id }} />;
}

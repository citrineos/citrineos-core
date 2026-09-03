// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TariffUpsert } from '@lib/client/pages/tariffs/upsert/tariff-upsert';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTariffPage({ params }: PageProps) {
  const { id } = await params;
  return <TariffUpsert params={{ id }} />;
}

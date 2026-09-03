// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { PartnersUpsert } from '@lib/client/pages/partners/upsert/partners-upsert';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPartnerPage({ params }: PageProps) {
  const { id } = await params;
  return <PartnersUpsert params={{ id }} />;
}

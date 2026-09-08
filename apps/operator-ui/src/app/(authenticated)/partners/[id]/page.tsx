// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { PartnersDetail } from '@lib/client/pages/partners/detail/partners-detail';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShowPartnerPage({ params }: PageProps) {
  const { id } = await params;
  return <PartnersDetail params={{ id }} />;
}

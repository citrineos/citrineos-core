// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AuthorizationDetail } from '@lib/client/pages/authorizations/detail/authorization-detail';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShowAuthorizationPage({ params }: PageProps) {
  const { id } = await params;
  return <AuthorizationDetail params={{ id }} />;
}

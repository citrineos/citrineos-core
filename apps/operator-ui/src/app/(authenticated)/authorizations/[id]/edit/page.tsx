// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AuthorizationUpsert } from '@lib/client/pages/authorizations/upsert/authorization-upsert';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAuthorizationPage({ params }: PageProps) {
  const { id } = await params;
  return <AuthorizationUpsert params={{ id }} />;
}

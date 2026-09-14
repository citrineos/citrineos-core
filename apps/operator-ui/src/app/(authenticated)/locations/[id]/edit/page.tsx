// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { LocationsUpsert } from '@lib/client/pages/locations/upsert/locations-upsert';
import config from '@lib/utils/config';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditLocationPage({ params }: PageProps) {
  const { id } = await params;
  return <LocationsUpsert params={{ id }} allowImageUpload={config.allowImageUpload} />;
}

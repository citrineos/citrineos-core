// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { LocationsUpsert } from '@lib/client/pages/locations/upsert/locations-upsert';
import config from '@lib/utils/config';

export default function NewLocationPage() {
  return <LocationsUpsert params={{}} allowImageUpload={config.allowImageUpload} />;
}

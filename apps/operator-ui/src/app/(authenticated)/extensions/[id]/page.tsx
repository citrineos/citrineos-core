// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { getExtension } from '@lib/server/extensions';
import { ExtensionFrame } from '@lib/client/components/extension-frame/extension-frame';

export default async function ExtensionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const extension = getExtension(id);

  if (!extension) {
    return <div className="p-6">Unknown extension: {id}</div>;
  }

  const apiBase = `/extensions/${id}/proxy`;

  return (
    <ExtensionFrame
      bundleUrl={`${apiBase}/extension-bundle.js`}
      apiBase={apiBase}
      title={extension.label}
    />
  );
}

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { NextRequest, NextResponse } from 'next/server';
import { getExtension } from '@lib/server/extensions';

// Forwards the request to the extension's internalUrl, preserving the full
// original path (including the /extensions/{id}/proxy prefix) because the
// extension app is itself configured with a matching basePath and expects
// to see — and strip — that same prefix.
export async function proxyToExtension(req: NextRequest, id: string) {
  const extension = getExtension(id);
  if (!extension) {
    return NextResponse.json({ error: 'unknown extension' }, { status: 404 });
  }

  const targetUrl = `${extension.internalUrl}${req.nextUrl.pathname}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');

  const hasBody = !['GET', 'HEAD'].includes(req.method);

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

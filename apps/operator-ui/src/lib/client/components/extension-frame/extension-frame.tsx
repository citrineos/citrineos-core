// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useEffect, useRef } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

interface ExtensionMountProps {
  bundleUrl: string; // e.g. /extensions/{id}/proxy/extension-bundle.js
  apiBase: string; // e.g. /extensions/{id}/proxy
  title: string;
}

// Loads the extension's UI bundle and mounts it directly into this page's
// own React tree (same process, same DOM) — no iframe, no postMessage.
// The extension bundle expects `window.React` / `window.ReactDOM` to be the
// host's own instances, which we set below, so there is exactly one React
// in the page and hooks/context behave normally.
export const ExtensionFrame = ({ bundleUrl, apiBase, title }: ExtensionMountProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let unmount: (() => void) | undefined;

    (window as any).React = React;
    (window as any).ReactDOM = ReactDOM;

    const getToken = async () => {
      const res = await fetch('/api/extensions/token');
      if (!res.ok) throw new Error('failed to obtain extension token');
      const { token } = await res.json();
      return token as string;
    };

    const script = document.createElement('script');
    script.src = bundleUrl;
    script.onload = () => {
      if (cancelled || !containerRef.current) return;
      const ext = (window as any).OpsToolsExtension;
      if (ext?.mount) {
        unmount = ext.mount(containerRef.current, { apiBase, getToken });
      }
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      unmount?.();
      script.remove();
    };
  }, [bundleUrl, apiBase]);

  return <div ref={containerRef} aria-label={title} className="p-6" />;
};

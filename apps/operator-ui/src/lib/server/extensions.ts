// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path from 'path';

export interface ExtensionDefinition {
  id: string;
  label: string;
  icon: string; // lucide icon name, or an https:// URL to an image
  internalUrl: string; // server-only: where Operator-UI proxies this extension's traffic to
}

export interface PublicExtension {
  id: string;
  label: string;
  icon: string;
}

// Drop or remove a *.json file here to install/uninstall an extension.
// No code change, rebuild, or infra/Cloudflare change required; this
// directory is read on every request, and Operator-UI proxies to
// `internalUrl` itself, so extensions never need their own public route.
const EXTENSIONS_DIR = path.join(process.cwd(), 'public', 'extensions');

export function getExtensions(): ExtensionDefinition[] {
  if (!fs.existsSync(EXTENSIONS_DIR)) return [];
  return fs
    .readdirSync(EXTENSIONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(EXTENSIONS_DIR, f), 'utf-8');
      return JSON.parse(raw) as ExtensionDefinition;
    });
}

export function getExtension(id: string): ExtensionDefinition | undefined {
  return getExtensions().find((e) => e.id === id);
}

// internalUrl is server-only; never send it to the browser.
export function toPublicExtension(e: ExtensionDefinition): PublicExtension {
  return { id: e.id, label: e.label, icon: e.icon };
}

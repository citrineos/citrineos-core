// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { NextResponse } from 'next/server';
import { getExtensions, toPublicExtension } from '@lib/server/extensions';

export async function GET() {
  return NextResponse.json(getExtensions().map(toPublicExtension));
}

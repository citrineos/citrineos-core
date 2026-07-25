// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { encode } from 'next-auth/jwt';
import authOptions from '@app/api/auth/[...nextauth]/options';

// Short-lived handoff token an embedded extension iframe can present to its
// own backend (as `Authorization: Bearer <token>`) instead of relying on a
// shared session cookie. Lets extensions live on a different origin than
// Operator-UI without breaking single sign-on.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const maxAge = 5 * 60;
  const token = await encode({
    token: { email: session.user?.email || session.user?.name || 'operator', purpose: 'extension-handoff' },
    secret: process.env.NEXTAUTH_SECRET as string,
    maxAge,
  });

  return NextResponse.json({ token, expiresIn: maxAge });
}

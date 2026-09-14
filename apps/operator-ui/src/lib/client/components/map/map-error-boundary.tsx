// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';

interface MapErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  // When any resetKey changes the boundary drops its error state and re-mounts
  // its children. Pass the active locale so the map comes back after the
  // teardown that a locale switch triggers.
  resetKeys?: ReadonlyArray<unknown>;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

/**
 * Isolates the Google Maps subtree so a render/commit-time exception in the
 * maps SDK cannot escalate to Next.js's global error page.
 */
export class MapErrorBoundary extends React.Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: MapErrorBoundaryProps): void {
    if (!this.state.hasError) return;
    const prev = prevProps.resetKeys ?? [];
    const next = this.props.resetKeys ?? [];
    const changed = prev.length !== next.length || next.some((key, i) => !Object.is(key, prev[i]));
    if (changed) this.setState({ hasError: false });
  }

  componentDidCatch(error: unknown): void {
    console.warn('[MapErrorBoundary] recovered from a map render error:', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

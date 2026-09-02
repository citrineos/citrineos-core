// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@lib/client/components/ui/resizable';
import { StationPreviewPanel } from '@lib/client/pages/charging-stations/station-preview-panel';
import { usePreview } from '@lib/client/hooks/use-preview';

export interface StationPreviewLayoutProps {
  children: React.ReactNode;
}

/**
 * Wraps a page's content in a horizontal resizable split so the station preview can open beside it
 * without hijacking the global app layout. The previewed station lives in the `?preview=` URL param
 * (via {@link usePreview}), so any control on the page (row click, eye icon, …) can open it, the
 * panel survives reloads, and the URL is directly shareable. The preview column is only mounted
 * while a station is selected.
 */
export const StationPreviewLayout: React.FC<StationPreviewLayoutProps> = ({ children }) => {
  const { preview, closePreview } = usePreview();

  return (
    <ResizablePanelGroup direction="horizontal" autoSaveId="station-preview">
      <ResizablePanel id="main" order={1} className="h-[96vh] overflow-auto">
        {children}
      </ResizablePanel>
      {preview != null && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel id="preview" order={2} defaultSize={30} minSize={20} maxSize={50}>
            <StationPreviewPanel ocppConnectionName={preview} onClose={closePreview} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
};

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { RootState } from '@lib/utils/store/store';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export const StationPreviewStateName = 'stationPreview';

interface StationPreviewState {
  /** ChargingStations.id currently previewed in the app-level side panel, or null when closed. */
  stationId: number | null;
}

const initialState: StationPreviewState = {
  stationId: null,
};

export const stationPreviewSlice = createSlice({
  name: StationPreviewStateName,
  initialState,
  reducers: {
    openStationPreview: (state, action: PayloadAction<number>) => {
      state.stationId = action.payload;
    },
    closeStationPreview: (state) => {
      state.stationId = null;
    },
  },
});

export const selectStationPreview = (state: RootState): StationPreviewState =>
  state[StationPreviewStateName];

export const { openStationPreview, closeStationPreview } = stationPreviewSlice.actions;

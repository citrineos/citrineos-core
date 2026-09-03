// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@lib/utils/store/store';

interface MapsState {
  googleMapsApiKey: string | undefined;
}

const initialState: MapsState = {
  googleMapsApiKey: undefined,
};

export const mapsSlice = createSlice({
  name: 'maps',
  initialState,
  reducers: {
    setGoogleMapsApiKey: (state, action: PayloadAction<string>) => {
      state.googleMapsApiKey = action.payload;
    },
  },
});

export const getGoogleMapsApiKey = createSelector(
  (state: RootState) => state.maps,
  (state) => state.googleMapsApiKey,
);

export const { setGoogleMapsApiKey } = mapsSlice.actions;

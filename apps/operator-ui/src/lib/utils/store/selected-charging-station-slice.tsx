// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationClass } from '@lib/cls/charging-station-dto';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@lib/utils/store/store';
import type { ChargingStationDto } from '@citrineos/types';

interface SelectedChargingStationState {
  selectedChargingStation: ChargingStationClass | undefined;
}

const initialState: SelectedChargingStationState = {
  selectedChargingStation: undefined,
};

export const selectedChargingStationSlice = createSlice({
  name: 'selectedChargingStation',
  initialState,
  reducers: {
    setSelectedChargingStation: (
      state,
      action: PayloadAction<{ selectedChargingStation: ChargingStationDto }>,
    ) => {
      (state as any).selectedChargingStation = action.payload.selectedChargingStation;
    },
  },
});

export const getSelectedChargingStation = () =>
  createSelector(
    (state: RootState) => state.selectedChargingStation,
    (state: SelectedChargingStationState) => state?.selectedChargingStation,
  );

export const { setSelectedChargingStation } = selectedChargingStationSlice.actions;

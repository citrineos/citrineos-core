// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@lib/utils/store/store';
import { instanceToPlain } from 'class-transformer';

interface AssociationSelectionState {
  models: { [key: string]: any };
}

const initialState: AssociationSelectionState = {
  models: {},
};

export const associationSelectionSlice = createSlice({
  name: 'associationSelection',
  initialState,
  reducers: {
    setSelectedAssociatedItems: (
      state,
      action: PayloadAction<{ storageKey: string; selectedRows: any }>,
    ) => {
      const { storageKey, selectedRows } = action.payload;
      state.models[storageKey] = instanceToPlain(selectedRows);
    },
  },
});

export const getSelectedAssociatedItems = (storageKey: string) =>
  createSelector(
    (state: RootState) => state.selectedAssociatedItems.models,
    (models) => (models[storageKey] ? JSON.parse(models[storageKey]) : []),
  );

export const { setSelectedAssociatedItems } = associationSelectionSlice.actions;

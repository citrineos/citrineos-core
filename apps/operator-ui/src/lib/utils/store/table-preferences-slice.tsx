// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ResourceType } from '@lib/utils/access-types';
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * On a table-by-table basis for more flexibility. If a table
 * is not represented in this state, assumes default values.
 */
interface TablePreferencesState {
  visibleColumns: Partial<Record<ResourceType | string, string[]>>;
  pageSize: Partial<Record<ResourceType | string, number>>;
}

export const tablePreferencesSliceKey = 'tablePreferences';

const initialState: TablePreferencesState = {
  visibleColumns: {},
  pageSize: {},
};

export const tablePreferencesSlice = createSlice({
  name: tablePreferencesSliceKey,
  initialState,
  reducers: {
    setVisibleColumnsPreference: (
      state,
      action: PayloadAction<{
        resource: ResourceType | string;
        columns: string[];
      }>,
    ) => {
      state.visibleColumns = {
        ...(state.visibleColumns ?? {}),
        [action.payload.resource]: [...action.payload.columns],
      };
    },
    setPageSizePreference: (
      state,
      action: PayloadAction<{
        resource: ResourceType | string;
        pageSize: number;
      }>,
    ) => {
      state.pageSize = {
        ...(state.pageSize ?? {}),
        [action.payload.resource]: action.payload.pageSize,
      };
    },
  },
});

export const getVisibleColumnsPreference = createSelector(
  [(state) => state[tablePreferencesSliceKey], (_state, resource) => resource],
  (state: TablePreferencesState, resource: ResourceType | string) =>
    resource && state.visibleColumns && state.visibleColumns[resource]
      ? state.visibleColumns[resource]
      : null,
);

export const getPageSizePreference = createSelector(
  [(state) => state[tablePreferencesSliceKey], (_state, resource) => resource],
  (state: TablePreferencesState, resource: ResourceType | string) =>
    resource && state.pageSize && state.pageSize[resource] ? state.pageSize[resource] : 10,
);

export const { setVisibleColumnsPreference, setPageSizePreference } = tablePreferencesSlice.actions;

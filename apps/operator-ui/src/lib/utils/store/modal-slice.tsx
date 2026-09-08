// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ModalComponentType } from '@lib/client/components/modals/modal-types';
import type { RootState } from '@lib/utils/store/store';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

export const ModalStateName = 'modal';

interface ModalState {
  isOpen: boolean;
  title: string;
  modalComponentType: ModalComponentType | null;
  modalComponentProps?: any;
}

const initialState: ModalState = {
  isOpen: false,
  title: '',
  modalComponentType: null,
  modalComponentProps: {},
};

export const modalSlice = createSlice({
  name: ModalStateName,
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{
        title: string;
        modalComponentType: ModalComponentType;
        modalComponentProps?: any;
      }>,
    ) => {
      state.isOpen = true;
      state.title = action.payload.title;
      state.modalComponentType = action.payload.modalComponentType;
      state.modalComponentProps = action.payload.modalComponentProps || {};
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.title = '';
      state.modalComponentType = null;
      state.modalComponentProps = {};
    },
  },
});

export const selectIsModalOpen = createSelector(
  (state: RootState) => state[ModalStateName],
  (modal) => modal.isOpen,
);

export const selectModal = (state: RootState): ModalState => state.modal;

export const { openModal, closeModal } = modalSlice.actions;

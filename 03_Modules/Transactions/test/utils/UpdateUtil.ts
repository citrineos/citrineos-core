// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
export type UpdateFunction<T> = (item: T) => void;

export const applyUpdateFunction = <T>(item: T, updateFunction?: UpdateFunction<T>): T => {
  if (updateFunction) {
    updateFunction(item);
  }
  return item;
};

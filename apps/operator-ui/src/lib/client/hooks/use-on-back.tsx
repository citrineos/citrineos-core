// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type BackFunction, useBack, useParsed } from '@refinedev/core';

export const useOnBack = (): BackFunction | undefined => {
  const back = useBack();
  const { action } = useParsed();

  const onBack = action !== 'list' || typeof action !== 'undefined' ? back : undefined;

  return onBack;
};

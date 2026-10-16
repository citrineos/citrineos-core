// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type ChargingStationDto, OCPPVersion } from '@citrineos/types';
import { ChargingStationClass } from '@lib/cls/charging-station-dto';
import { plainToInstance } from 'class-transformer';
import { useMemo, type ReactNode } from 'react';
import { useTranslate } from '@refinedev/core';

/**
 * Total over OCPPVersion on purpose: a new protocol version fails to compile here until every
 * modal says what to render for it, rather than falling through to "unsupported" at runtime.
 */
export type VersionedRender<S = ChargingStationDto> = Record<
  OCPPVersion,
  (station: S) => ReactNode
>;

export interface VersionedModalProps<S> {
  station: unknown;
  render: VersionedRender<S>;
}

export function VersionedModal<S = ChargingStationDto>({
  station,
  render,
}: VersionedModalProps<S>) {
  const translate = useTranslate();
  const parsed = useMemo(() => plainToInstance(ChargingStationClass, station), [station]);
  const protocol = parsed.protocol as OCPPVersion | undefined;
  const renderForVersion = protocol ? render[protocol] : undefined;

  if (!renderForVersion) {
    return <div>{translate('ChargingStations.unsupportedProtocol', { protocol })}</div>;
  }

  return <div>{renderForVersion(parsed as S)}</div>;
}

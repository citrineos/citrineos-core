// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type ImplicitLabelType } from 'recharts/types/component/Label';

export type ChartData = {
  elapsedTime: number;
  [unit: string]: number | string;
}[];

export const generateTimeTicks = (chartData: ChartData) => {
  if (!chartData || chartData.length === 0) return [0];

  const totalSeconds = chartData[chartData.length - 1].elapsedTime;

  let interval = 0;
  if (totalSeconds < 30)
    interval = 5; // 5 seconds
  else if (totalSeconds < 90)
    interval = 15; // 15 seconds
  else if (totalSeconds < 360)
    interval = 60; // 1 minute
  else if (totalSeconds < 2100)
    interval = 300; // 5 minutes
  else if (totalSeconds < 6300)
    interval = 900; // 15 minutes
  else if (totalSeconds < 12600)
    interval = 1800; // 30 minutes
  else interval = 3600; // 1 hour

  const ticks: number[] = [];
  for (let tick = 0; tick * interval <= totalSeconds; tick++) {
    ticks.push(tick * interval);
  }

  return ticks;
};

export const formatTimeLabel = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  }
};

export const chartSize = 'min-w-[50px] min-h-[100px]';
export const chartMargin = { bottom: 25 };

export const getXAxisLabelConfig = (label: string): ImplicitLabelType => ({
  value: label,
  position: 'insideBottom',
  offset: -20,
});
export const getYAxisLabelConfig = (label: string): ImplicitLabelType => ({
  value: label,
  angle: -90,
  position: 'insideLeft',
  style: { textAnchor: 'middle' },
});

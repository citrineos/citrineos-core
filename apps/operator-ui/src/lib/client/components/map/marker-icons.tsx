// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import type { MarkerIconProps } from '@lib/client/components/map/types';

export const MarkerIconCircle: React.FC<MarkerIconProps> = ({
  style,
  fillColor = 'currentColor',
  status = 'offline',
}) => {
  return (
    <div
      style={{
        ...style,
        backgroundColor: fillColor,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
      }}
    >
      <LocationIcon width={'70%'} height={'100%'} color={'white'} />
    </div>
  );
};

export const LocationIcon: React.FC<{
  width?: string | number;
  height?: string | number;
  color?: string;
}> = ({ width = 24, height = 24, color = 'white' }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
      fill={color}
    />
  </svg>
);

export const ChargingStationIcon: React.FC<{
  width?: string | number;
  height?: string | number;
  color?: string;
  status?: 'online' | 'offline' | 'partial';
}> = ({ width = 24, height = 24, color = 'white', status = 'offline' }) => {
  // Add a subtle indicator of status via the bolt color
  const boltColor = status === 'online' ? '#4CAF50' : status === 'partial' ? '#FFC107' : '#757575';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.77 7.23L19.78 7.22L16.06 3.5L15 4.56L17.11 6.67C16.17 7.03 15.5 7.93 15.5 9C15.5 10.38 16.62 11.5 18 11.5C18.36 11.5 18.69 11.42 19 11.29V18.5C19 19.05 18.55 19.5 18 19.5C17.45 19.5 17 19.05 17 18.5V14C17 12.9 16.1 12 15 12H14V5C14 3.9 13.1 3 12 3H6C4.9 3 4 3.9 4 5V21H14V13.5H15.5V18.5C15.5 19.88 16.62 21 18 21C19.38 21 20.5 19.88 20.5 18.5V9C20.5 8.31 20.22 7.68 19.77 7.23ZM12 10H6V5H12V10Z"
        fill={color}
      />
      <path
        d="M18 10C18.55 10 19 9.55 19 9C19 8.45 18.55 8 18 8C17.45 8 17 8.45 17 9C17 9.55 17.45 10 18 10Z"
        fill={boltColor}
      />
      <path
        d="M8 16H10V14H8V16ZM8 13H10V11H8V13ZM8 19H10V17H8V19ZM12 16H14V14H12V16ZM12 13H14V11H12V13ZM12 19H14V17H12V19Z"
        fill={boltColor}
      />
    </svg>
  );
};

export const ClusterIcon: React.FC<{
  count: number;
  type?: 'station' | 'location' | 'mixed';
  color?: string;
}> = ({ count, type = 'location', color = 'var(--color-primary)' }) => {
  const size = Math.min(60, Math.max(40, 30 + Math.log10(count) * 10));

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
      }}
    >
      {count}
      {type === 'station' && (
        <div
          style={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            backgroundColor: '#4CAF50',
            borderRadius: '50%',
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid white',
          }}
        >
          <ChargingStationIcon width={10} height={10} />
        </div>
      )}
      {type === 'location' && (
        <div
          style={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            backgroundColor: '#2196F3',
            borderRadius: '50%',
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid white',
          }}
        >
          <LocationIcon width={10} height={10} />
        </div>
      )}
    </div>
  );
};

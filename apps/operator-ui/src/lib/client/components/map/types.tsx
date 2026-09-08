// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { LocationDto } from '@citrineos/types';
import type { GeoPoint } from '@lib/utils/geo-point';
import type { ReactNode } from 'react';

export interface MapMarkerData {
  position: google.maps.LatLngLiteral;
  identifier: string;
  type: 'station' | 'location' | 'mixed';
  locationId?: string;
  status?: 'online' | 'offline' | 'partial';
  color?: string;
  reactContent?: ReactNode;
}

export interface BaseMapMarkerProps {
  position: google.maps.LatLngLiteral;
  identifier: string;
  reactContent?: ReactNode;
  onClick?: (id: string, type: 'station' | 'location' | 'mixed') => void;
  isSelected?: boolean;
  color?: string;
  status?: 'online' | 'offline' | 'partial';
}

export interface StationMapMarkerProps extends BaseMapMarkerProps {
  type: 'station';
  locationId?: string;
}

export interface LocationMapMarkerProps extends BaseMapMarkerProps {
  type: 'location';
}

export interface ClusterMapMarkerProps extends BaseMapMarkerProps {
  type: 'mixed';
  count: number;
}

export type MapMarkerProps = StationMapMarkerProps | LocationMapMarkerProps | ClusterMapMarkerProps;

export interface MapProps {
  locations?: LocationDto[];
  defaultCenter?: google.maps.LatLngLiteral;
  zoom?: number;
  onMarkerClick?: (id: string, type: 'station' | 'location' | 'mixed') => void;
  selectedMarkerId?: string;
  clusterByLocation?: boolean;
}

export interface LocationPickerMapProps {
  point?: GeoPoint;
  defaultCenter?: google.maps.LatLngLiteral;
  zoom?: number;
  onLocationSelect: (point: GeoPoint) => void;
}

export interface MarkerIconProps {
  style?: React.CSSProperties;
  fillColor?: string;
  status?: 'online' | 'offline' | 'partial';
}

export interface ClusterInfo extends MapMarkerData {
  markers: MapMarkerData[];
  count: number;
}

// Group of markers from the same location
export interface LocationGroup {
  locationId: string;
  locationMarker: MapMarkerData;
  stationMarkers: MapMarkerData[];
  isComplete: boolean; // true if all stations from this location are present
}

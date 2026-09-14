// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { LocationDto } from '@citrineos/types';
import { MapMarkerComponent } from '@lib/client/components/map/map-marker';
import { ClusterIcon } from '@lib/client/components/map/marker-icons';
import type {
  ClusterInfo,
  LocationGroup,
  MapMarkerData,
  MapProps,
} from '@lib/client/components/map/types';
import { ActionType, ResourceType } from '@lib/utils/access-types';
import config from '@lib/utils/config';
import { CanAccess } from '@refinedev/core';
import {
  AdvancedMarker,
  APILoadingStatus,
  APIProvider,
  Map as GoogleMap,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getGoogleMapsApiKey, setGoogleMapsApiKey } from '@lib/utils/store/maps-slice';
import { getGoogleMapsApiKeyAction } from '@lib/server/actions/map/get-google-maps-api-key-action';
import { Skeleton } from '@lib/client/components/ui/skeleton';

// https://visgl.github.io/react-google-maps/docs/api-reference/components/map#camera-control
const zoomMax = 5;

/**
 * Main map component that supports marker clustering
 */
export const LocationMap: React.FC<MapProps> = ({
  locations = [],
  defaultCenter = { lat: 36.7783, lng: -119.4179 },
  zoom = 10,
  onMarkerClick,
  selectedMarkerId,
  clusterByLocation = true,
}) => {
  const dispatch = useDispatch();
  const apiKey = useSelector(getGoogleMapsApiKey);

  useEffect(() => {
    if (apiKey === undefined) {
      getGoogleMapsApiKeyAction().then((result) =>
        dispatch(setGoogleMapsApiKey(result.success ? result.data : '')),
      );
    }
  }, [apiKey, dispatch]);

  // Create station markers from location data
  const stationMarkers: MapMarkerData[] = useMemo(() => {
    return locations
      .filter((location) => location.coordinates)
      .flatMap((location) => {
        return (location.chargingPool || []).map((station) => {
          const coordinates = station.coordinates || location.coordinates;
          const position = {
            lat: coordinates?.coordinates[1] || 0,
            lng: coordinates?.coordinates[0] || 0,
          };

          return {
            position,
            identifier: station.ocppConnectionName,
            type: 'station' as const,
            locationId: location.id!.toString(),
            status: station.isOnline ? 'online' : ('offline' as const),
            color: station.isOnline ? 'var(--primary-color-1)' : 'var(--secondary-color-2)',
          } as MapMarkerData;
        });
      });
  }, [locations]);

  // Create location markers
  const locationMarkers: MapMarkerData[] = useMemo(() => {
    return locations
      .filter((location) => location.coordinates)
      .map((location) => {
        const position = {
          lat: location.coordinates.coordinates[1],
          lng: location.coordinates.coordinates[0],
        };

        const status = determineLocationStatus(location);

        return {
          position,
          identifier: location.id!.toString(),
          type: 'location' as const,
          status,
          color: determineLocationColor(status),
        } as MapMarkerData;
      });
  }, [locations]);

  // Add a fallback marker if there are no markers
  const allMarkers: MapMarkerData[] = useMemo(() => {
    if (stationMarkers.length === 0 && locationMarkers.length === 0) {
      return [
        {
          position: defaultCenter,
          identifier: 'default',
          type: 'location' as const,
          status: 'offline' as const,
          color: 'var(--secondary-color-2)',
        } as MapMarkerData,
      ];
    }
    return [...stationMarkers, ...locationMarkers];
  }, [stationMarkers, locationMarkers, defaultCenter]);

  return apiKey === undefined ? (
    <Skeleton className="size-full" />
  ) : (
    <CanAccess resource={ResourceType.LOCATIONS} action={ActionType.LIST}>
      <APIProvider apiKey={apiKey}>
        <MapWithClustering
          locations={locations}
          markers={allMarkers}
          defaultCenter={defaultCenter}
          zoom={zoom}
          onMarkerClick={onMarkerClick}
          selectedMarkerId={selectedMarkerId}
          clusterByLocation={clusterByLocation}
        />
      </APIProvider>
    </CanAccess>
  );
};

// Helper component that handles clustering logic
const MapWithClustering: React.FC<{
  markers: MapMarkerData[];
  locations: MapProps['locations'];
  defaultCenter: MapProps['defaultCenter'];
  zoom: MapProps['zoom'];
  onMarkerClick: MapProps['onMarkerClick'];
  selectedMarkerId: MapProps['selectedMarkerId'];
  clusterByLocation: MapProps['clusterByLocation'];
}> = ({
  markers,
  locations = [],
  defaultCenter,
  zoom: initialZoom = zoomMax,
  onMarkerClick,
  selectedMarkerId,
  clusterByLocation = true,
}) => {
  // Track if map is fully initialized and ready for markers
  const [mapFullyInitialized, setMapFullyInitialized] = useState(false);
  const status = useApiLoadingStatus();
  const [visibleElements, setVisibleElements] = useState<(ClusterInfo | MapMarkerData)[]>([]);
  const [zoom, setZoom] = useState(initialZoom);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const map = useMap();

  // Wait until the map API is fully loaded
  useEffect(() => {
    if (status === APILoadingStatus.LOADED) {
      setMapFullyInitialized(true);
    } else {
      setMapFullyInitialized(false);
    }
  }, [status]);

  // Update visible elements when map bounds change or markers change
  useEffect(() => {
    if (!map || !bounds || !markers) return;

    // Filter markers to those in the current view
    const visibleMarkers = markers.filter((marker) => bounds.contains(marker.position));

    // Set up clustering based on zoom level and location grouping preference
    if (zoom <= zoomMax && clusterByLocation) {
      // High-level clustering - create clusters of locations
      const clusters = createLocationClusters(visibleMarkers, locations, bounds);
      setVisibleElements(clusters);
      // } else if (zoom <= 14 && clusterByLocation) {
      //   // Mid-level clustering - show individual locations and cluster stations
      //   const elements = createLocationBasedElements(visibleMarkers, locations);
      //   setVisibleElements(elements);
    } else {
      // Low-level - show individual stations
      setVisibleElements(visibleMarkers);
    }
  }, [map, bounds, zoom, markers, locations, clusterByLocation]);

  // Set up event listeners for map changes
  useEffect(() => {
    if (!map) return;

    const updateZoom = () => {
      const newZoom = map.getZoom();
      if (newZoom) setZoom(newZoom);
    };
    updateZoom();
    const zoomListener = map.addListener('zoom_changed', updateZoom);

    const updateBounds = () => {
      const newBounds = map.getBounds();
      if (newBounds) setBounds(newBounds);
    };
    updateBounds();
    const boundsListener = map.addListener('bounds_changed', updateBounds);

    return () => {
      google.maps.event.removeListener(zoomListener);
      google.maps.event.removeListener(boundsListener);
    };
  }, [map]);

  // Set map bounds to include all markers when map is initialized or markers change
  useEffect(() => {
    if (map && markers.length > 0) {
      const newBounds = new google.maps.LatLngBounds();

      markers.forEach((marker) => {
        newBounds.extend(marker.position);
      });

      map.fitBounds(newBounds);
    }
  }, [map, markers]);

  // Ensure selected marker is in view
  useEffect(() => {
    if (map && selectedMarkerId) {
      const selectedMarker = markers.find((marker) => marker.identifier === selectedMarkerId);
      if (selectedMarker) {
        map.panTo(selectedMarker.position);

        // Zoom in a bit if we're zoomed out too far
        if (zoom < zoomMax) {
          map.setZoom(zoomMax);
        }
      }
    }
  }, [selectedMarkerId, map, markers, zoom]);

  // Render the map and markers/clusters
  return (
    <GoogleMap
      mapId={config.googleMapsOverviewMapId}
      defaultCenter={defaultCenter}
      defaultZoom={initialZoom}
      gestureHandling="cooperative"
      disableDefaultUI={false}
      zoomControl={true}
      fullscreenControl={false}
    >
      {mapFullyInitialized &&
        visibleElements.map((element, index) => {
          // Handle cluster elements
          if ('count' in element) {
            return (
              <AdvancedMarker
                key={`cluster-${index}`}
                position={element.position}
                onClick={() => {
                  // Zoom in when cluster is clicked
                  if (map) {
                    const bounds = new google.maps.LatLngBounds();
                    element.markers.forEach((marker) => {
                      bounds.extend(marker.position);
                    });
                    map.fitBounds(bounds);
                  }
                }}
              >
                <ClusterIcon
                  count={element.count}
                  type={element.type}
                  color={'var(--grayscale-color-1)'}
                />
              </AdvancedMarker>
            );
          }
          // if ('markers' in element && element.markers) {
          // }
          // Handle regular marker elements
          return (
            <MapMarkerComponent
              key={element.identifier}
              position={element.position}
              identifier={element.identifier}
              reactContent={element.reactContent}
              onClick={
                onMarkerClick ? () => onMarkerClick(element.identifier, element.type) : undefined
              }
              isSelected={element.identifier === selectedMarkerId}
              color={element.color || 'var(--secondary-color-2)'}
              type={element.type}
              status={element.status}
            />
          );
        })}
    </GoogleMap>
  );
};

// Helper function to create location-based clusters
function createLocationClusters(
  visibleMarkers: MapMarkerData[],
  locations: MapProps['locations'] = [],
  bounds: google.maps.LatLngBounds,
): (ClusterInfo | MapMarkerData)[] {
  // First, create location groups
  const locationGroups = createLocationGroups(visibleMarkers, locations);

  // No location groups, just return the markers
  if (locationGroups.length === 0) {
    return visibleMarkers;
  }

  // Group locations that are close to each other
  const clusters: ClusterInfo[] = [];
  const processedLocations = new Set<string>();
  const distanceThreshold = calculateDistanceThreshold(bounds);

  for (let i = 0; i < locationGroups.length; i++) {
    const group = locationGroups[i];

    // Skip if already in a cluster
    if (processedLocations.has(group.locationId)) continue;

    // Start a new potential cluster
    const clusterMarkers: MapMarkerData[] = [];
    const locationIds = new Set<string>();

    // Add this location to the cluster
    clusterMarkers.push(group.locationMarker);
    clusterMarkers.push(...group.stationMarkers);
    locationIds.add(group.locationId);
    processedLocations.add(group.locationId);

    // Look for nearby locations to add to the cluster
    for (let j = 0; j < locationGroups.length; j++) {
      if (i === j) continue;
      const otherGroup = locationGroups[j];

      // Skip if already in a cluster
      if (processedLocations.has(otherGroup.locationId)) continue;

      // Check if locations are close enough to cluster
      if (
        arePointsWithinDistance(
          group.locationMarker.position,
          otherGroup.locationMarker.position,
          distanceThreshold,
        )
      ) {
        clusterMarkers.push(otherGroup.locationMarker);
        clusterMarkers.push(...otherGroup.stationMarkers);
        locationIds.add(otherGroup.locationId);
        processedLocations.add(otherGroup.locationId);
      }
    }

    // Create a cluster if we have more than one location
    if (locationIds.size > 1) {
      clusters.push({
        identifier: clusters.length.toString(),
        markers: clusterMarkers,
        type: 'mixed',
        count: clusterMarkers.length,
        position: calculateCenter(clusterMarkers.map((m) => m.position)),
        color: 'var(--grayscale-color-1)',
      });
    } else {
      // Just return the location if it's not clustered
      clusters.push({
        identifier: clusters.length.toString(),
        markers: clusterMarkers,
        type: 'location',
        count: clusterMarkers.length,
        position: group.locationMarker.position,
        color: group.locationMarker.color,
      });
    }
  }

  // Return any markers that aren't part of a location group
  const ungroupedMarkers = visibleMarkers.filter(
    (marker) => !marker.locationId || !processedLocations.has(marker.locationId),
  );

  return [...clusters, ...ungroupedMarkers];
}

// Helper function to create elements based on location grouping
function createLocationBasedElements(
  visibleMarkers: MapMarkerData[],
  locations: MapProps['locations'] = [],
): (ClusterInfo | MapMarkerData)[] {
  // Create location groups
  const locationGroups = createLocationGroups(visibleMarkers, locations);

  const elements: (ClusterInfo | MapMarkerData)[] = [];
  const processedStationIds = new Set<string>();

  // Add location markers for complete location groups
  locationGroups.forEach((group) => {
    // if (group.isComplete) {
    // Add the location marker
    elements.push(group.locationMarker);

    // Mark these stations as processed
    group.stationMarkers.forEach((station) => {
      processedStationIds.add(station.identifier);
    });
    // } else {
    //   // For incomplete location groups, just add the individual station markers
    //   group.stationMarkers.forEach((station) => {
    //     elements.push(station);
    //     processedStationIds.add(station.identifier);
    //   });
    // }
  });

  // Add any markers that weren't in a location group
  visibleMarkers.forEach((marker) => {
    if (!processedStationIds.has(marker.identifier)) {
      elements.push(marker);
    }
  });

  return elements;
}

// Helper function to create location groups from markers
function createLocationGroups(
  markers: MapMarkerData[],
  locations: MapProps['locations'] = [],
): LocationGroup[] {
  if (!locations || locations.length === 0) return [];

  // Group station markers by location
  const markersByLocation = new Map<string, MapMarkerData[]>();

  markers.forEach((marker) => {
    if (marker.type === 'station' && marker.locationId) {
      const locationMarkers = markersByLocation.get(marker.locationId) || [];
      locationMarkers.push(marker);
      markersByLocation.set(marker.locationId, locationMarkers);
    }
  });

  // Create location groups
  return Array.from(markersByLocation.entries())
    .map(([locationId, stationMarkers]) => {
      const location = locations.find((l) => l.id!.toString() === locationId);
      if (!location || !location.coordinates) return null;

      // Create a marker for this location
      const locationMarker: MapMarkerData = {
        position: {
          lat: location.coordinates.coordinates[1],
          lng: location.coordinates.coordinates[0],
        },
        identifier: location.id!.toString(),
        type: 'location',
        status: determineLocationStatus(location),
        color: determineLocationColor(determineLocationStatus(location)),
      };

      // Check if all stations from this location are present in the markers
      const totalStationsInLocation = location.chargingPool?.length || 0;
      const isComplete = stationMarkers.length === totalStationsInLocation;

      return {
        locationId,
        locationMarker,
        stationMarkers,
        isComplete,
      };
    })
    .filter((group): group is LocationGroup => group !== null);
}

// Helper function to calculate the distance threshold based on map bounds
function calculateDistanceThreshold(bounds: google.maps.LatLngBounds): number {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  // Calculate diagonal distance of the visible map area
  const diagonalDistance = calculateDistance(ne.lat(), ne.lng(), sw.lat(), sw.lng());

  // Return a percentage of the diagonal as the threshold
  return diagonalDistance * 0.05; // 5% of diagonal distance
}

// Helper function to check if two points are within a certain distance
function arePointsWithinDistance(
  p1: google.maps.LatLngLiteral,
  p2: google.maps.LatLngLiteral,
  threshold: number,
): boolean {
  const distance = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
  return distance <= threshold;
}

// Helper function to calculate distance between two coordinates in km (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Helper function to calculate the center of a group of points
function calculateCenter(positions: google.maps.LatLngLiteral[]): google.maps.LatLngLiteral {
  if (positions.length === 0) {
    return { lat: 0, lng: 0 };
  }

  if (positions.length === 1) {
    return positions[0];
  }

  const sumLat = positions.reduce((sum, pos) => sum + pos.lat, 0);
  const sumLng = positions.reduce((sum, pos) => sum + pos.lng, 0);

  return {
    lat: sumLat / positions.length,
    lng: sumLng / positions.length,
  };
}

// Helper function to determine a location's status based on its charging stations
function determineLocationStatus(location: LocationDto): 'online' | 'offline' | 'partial' {
  if (!location.chargingPool || location.chargingPool.length === 0) {
    return 'offline';
  }

  const onlineCount = location.chargingPool.filter((station: any) => station.isOnline).length;

  if (onlineCount === location.chargingPool.length) {
    return 'online';
  } else if (onlineCount === 0) {
    return 'offline';
  } else {
    return 'partial';
  }
}

// Helper function to determine a location's color based on its status
function determineLocationColor(status: 'online' | 'offline' | 'partial'): string {
  switch (status) {
    case 'online':
      return 'var(--primary-color-1)';
    case 'partial':
      return 'var(--grayscale-color-2)';
    case 'offline':
    default:
      return 'var(--secondary-color-2)';
  }
}

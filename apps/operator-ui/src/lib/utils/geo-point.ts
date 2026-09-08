// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Point } from 'geojson';
import type { ValidationOptions } from 'class-validator';
import { buildMessage, IsNumber, ValidateBy } from 'class-validator';

export enum PointProps {
  type = 'type',
  coordinates = 'coordinates',
}
export class GeoPoint {
  private static TYPE = 'Point';
  private static CRS = {
    type: 'name',
    properties: {
      name: 'urn:ogc:def:crs:EPSG::4326',
    },
  };

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  public constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  get json() {
    return {
      type: GeoPoint.TYPE,
      coordinates: [this.latitude, this.longitude],
      crs: GeoPoint.CRS,
    };
  }

  static parse(value: GeoPoint | Point): GeoPoint | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (isGeoPoint(value)) {
      return value;
    } else {
      return new GeoPoint(value.coordinates[0], value.coordinates[1]);
    }
  }
}

const IS_GEO_POINT = 'isGeoPoint';

export function isGeoPoint(value: unknown): value is GeoPoint {
  return value instanceof GeoPoint && !isNaN(value.latitude) && !isNaN(value.longitude);
}

export function IsGeoPoint(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_GEO_POINT,
      validator: {
        validate: (value, _args): boolean => isGeoPoint(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be a GeoPoint instance',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/location.dto

# 00_Base/src/interfaces/dto/location.dto

## Type Aliases

### LocationCreate

```ts
type LocationCreate = z.infer<typeof LocationCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/location.dto.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/location.dto.ts#L40)

---

### LocationDto

```ts
type LocationDto = z.infer<typeof LocationSchema>;
```

Defined in: [00_Base/src/interfaces/dto/location.dto.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/location.dto.ts#L30)

## Variables

### LocationCreateSchema

```ts
const LocationCreateSchema: ZodObject<
  {
    address: ZodString;
    city: ZodString;
    coordinates: ZodObject<
      {
        coordinates: ZodArray<ZodNumber>;
        type: ZodLiteral<'Point'>;
      },
      $strip
    >;
    country: ZodString;
    facilities: ZodOptional<
      ZodNullable<
        ZodArray<
          ZodEnum<{
            Airport: 'Airport';
            BikeSharing: 'BikeSharing';
            BusStop: 'BusStop';
            Cafe: 'Cafe';
            CarpoolParking: 'CarpoolParking';
            FuelStation: 'FuelStation';
            Hotel: 'Hotel';
            Mall: 'Mall';
            MetroStation: 'MetroStation';
            Museum: 'Museum';
            Nature: 'Nature';
            ParkingLot: 'ParkingLot';
            RecreationArea: 'RecreationArea';
            Restaurant: 'Restaurant';
            Sport: 'Sport';
            Supermarket: 'Supermarket';
            TaxiStand: 'TaxiStand';
            TrainStation: 'TrainStation';
            TramStop: 'TramStop';
            Wifi: 'Wifi';
          }>
        >
      >
    >;
    name: ZodString;
    openingHours: ZodOptional<ZodNullable<ZodAny>>;
    parkingType: ZodOptional<
      ZodNullable<
        ZodEnum<{
          AlongMotorway: 'AlongMotorway';
          OnDriveway: 'OnDriveway';
          OnStreet: 'OnStreet';
          ParkingGarage: 'ParkingGarage';
          ParkingLot: 'ParkingLot';
          UndergroundGarage: 'UndergroundGarage';
        }>
      >
    >;
    postalCode: ZodString;
    publishUpstream: ZodDefault<ZodBoolean>;
    state: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    timeZone: ZodDefault<ZodString>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/location.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/location.dto.ts#L32)

---

### LocationProps

```ts
const LocationProps: object;
```

Defined in: [00_Base/src/interfaces/dto/location.dto.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/location.dto.ts#L28)

#### Type Declaration

| Name                                                    | Type                | Defined in |
| ------------------------------------------------------- | ------------------- | ---------- |
| <a id="property-address"></a> `address`                 | `"address"`         |            |
| <a id="property-chargingpool"></a> `chargingPool`       | `"chargingPool"`    |            |
| <a id="property-city"></a> `city`                       | `"city"`            |            |
| <a id="property-coordinates"></a> `coordinates`         | `"coordinates"`     |            |
| <a id="property-country"></a> `country`                 | `"country"`         |            |
| <a id="property-createdat"></a> `createdAt`             | `"createdAt"`       |            |
| <a id="property-facilities"></a> `facilities`           | `"facilities"`      |            |
| <a id="property-id"></a> `id`                           | `"id"`              |            |
| <a id="property-name"></a> `name`                       | `"name"`            |            |
| <a id="property-openinghours"></a> `openingHours`       | `"openingHours"`    |            |
| <a id="property-parkingtype"></a> `parkingType`         | `"parkingType"`     |            |
| <a id="property-postalcode"></a> `postalCode`           | `"postalCode"`      |            |
| <a id="property-publishupstream"></a> `publishUpstream` | `"publishUpstream"` |            |
| <a id="property-state"></a> `state`                     | `"state"`           |            |
| <a id="property-tenant"></a> `tenant`                   | `"tenant"`          |            |
| <a id="property-tenantid"></a> `tenantId`               | `"tenantId"`        |            |
| <a id="property-timezone"></a> `timeZone`               | `"timeZone"`        |            |
| <a id="property-updatedat"></a> `updatedAt`             | `"updatedAt"`       |            |

---

### LocationSchema

```ts
const LocationSchema: ZodObject<{
  address: ZodString;
  chargingPool: ZodOptional<ZodNullable<ZodArray<ZodObject<{
     capabilities: ZodOptional<ZodNullable<ZodArray<ZodEnum<...>>>>;
     chargeBoxSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     chargePointModel: ZodOptional<ZodNullable<ZodString>>;
     chargePointSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     chargePointVendor: ZodOptional<ZodNullable<ZodString>>;
     connectors: ZodOptional<ZodNullable<ZodArray<ZodObject<..., ...>>>>;
     coordinates: ZodOptional<ZodNullable<ZodObject<{
        coordinates: ...;
        type: ...;
     }, $strip>>>;
     createdAt: ZodOptional<ZodDate>;
     evses: ZodOptional<ZodNullable<ZodArray<ZodObject<..., ...>>>>;
     firmwareVersion: ZodOptional<ZodNullable<ZodString>>;
     floorLevel: ZodOptional<ZodNullable<ZodString>>;
     iccid: ZodOptional<ZodNullable<ZodString>>;
     id: ZodString;
     imsi: ZodOptional<ZodNullable<ZodString>>;
     isOnline: ZodBoolean;
     latestOcppMessageTimestamp: ZodOptional<ZodNullable<ZodString>>;
     locationId: ZodOptional<ZodNullable<ZodNumber>>;
     meterSerialNumber: ZodOptional<ZodNullable<ZodString>>;
     meterType: ZodOptional<ZodNullable<ZodString>>;
     networkProfiles: ZodOptional<ZodAny>;
     parkingRestrictions: ZodOptional<ZodNullable<ZodArray<ZodEnum<...>>>>;
     protocol: ZodOptional<ZodNullable<ZodEnum<typeof OCPPVersion>>>;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<...>;
        createdAt: ZodOptional<...>;
        id: ZodOptional<...>;
        isUserTenant: ZodDefault<...>;
        name: ZodString;
        partyId: ZodOptional<...>;
        serverProfileOCPI: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
        url: ZodOptional<...>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     updatedAt: ZodOptional<ZodDate>;
     use16StatusNotification0: ZodOptional<ZodNullable<ZodDefault<ZodBoolean>>>;
  }, $strip>>>>;
  city: ZodString;
  coordinates: ZodObject<{
     coordinates: ZodArray<ZodNumber>;
     type: ZodLiteral<"Point">;
  }, $strip>;
  country: ZodString;
  createdAt: ZodOptional<ZodDate>;
  facilities: ZodOptional<ZodNullable<ZodArray<ZodEnum<{
     Airport: "Airport";
     BikeSharing: "BikeSharing";
     BusStop: "BusStop";
     Cafe: "Cafe";
     CarpoolParking: "CarpoolParking";
     FuelStation: "FuelStation";
     Hotel: "Hotel";
     Mall: "Mall";
     MetroStation: "MetroStation";
     Museum: "Museum";
     Nature: "Nature";
     ParkingLot: "ParkingLot";
     RecreationArea: "RecreationArea";
     Restaurant: "Restaurant";
     Sport: "Sport";
     Supermarket: "Supermarket";
     TaxiStand: "TaxiStand";
     TrainStation: "TrainStation";
     TramStop: "TramStop";
     Wifi: "Wifi";
  }>>>>;
  id: ZodOptional<ZodNumber>;
  name: ZodString;
  openingHours: ZodOptional<ZodNullable<ZodAny>>;
  parkingType: ZodOptional<ZodNullable<ZodEnum<{
     AlongMotorway: "AlongMotorway";
     OnDriveway: "OnDriveway";
     OnStreet: "OnStreet";
     ParkingGarage: "ParkingGarage";
     ParkingLot: "ParkingLot";
     UndergroundGarage: "UndergroundGarage";
  }>>>;
  postalCode: ZodString;
  publishUpstream: ZodDefault<ZodBoolean>;
  state: ZodString;
  tenant: ZodOptional<ZodObject<{
     countryCode: ZodOptional<ZodNullable<ZodString>>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     isUserTenant: ZodDefault<ZodBoolean>;
     name: ZodString;
     partyId: ZodOptional<ZodNullable<ZodString>>;
     serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<{
        credentialsRole: ZodObject<{
           businessDetails: ...;
           role: ...;
        }, $strip>;
        versionDetails: ZodArray<ZodObject<..., ...>>;
        versionEndpoints: ZodRecord<ZodString, ZodArray<...>>;
     }, $strip>>>;
     updatedAt: ZodOptional<ZodDate>;
     url: ZodOptional<ZodNullable<ZodString>>;
  }, $strip>>;
  tenantId: ZodOptional<ZodNumber>;
  timeZone: ZodDefault<ZodString>;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/location.dto.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/location.dto.ts#L11)

---

### locationSchemas

```ts
const locationSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/location.dto.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/location.dto.ts#L42)

#### Type Declaration

| Name                                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Default value          | Defined in                                                                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-location"></a> `Location`             | `ZodObject`\<\{ `address`: `ZodString`; `chargingPool`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodObject`\<\{ `capabilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `chargeBoxSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointModel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `chargePointVendor`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `connectors`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `coordinates`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `evses`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `firmwareVersion`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `floorLevel`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `iccid`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodString`; `imsi`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `isOnline`: `ZodBoolean`; `latestOcppMessageTimestamp`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `locationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `meterSerialNumber`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `meterType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `networkProfiles`: `ZodOptional`\<`ZodAny`\>; `parkingRestrictions`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<...\>\>\>; `protocol`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<...\>\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `use16StatusNotification0`: `ZodOptional`\<`ZodNullable`\<`ZodDefault`\<...\>\>\>; \}, `$strip`\>\>\>\>; `city`: `ZodString`; `coordinates`: `ZodObject`\<\{ `coordinates`: `ZodArray`\<`ZodNumber`\>; `type`: `ZodLiteral`\<`"Point"`\>; \}, `$strip`\>; `country`: `ZodString`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `facilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Airport`: `"Airport"`; `BikeSharing`: `"BikeSharing"`; `BusStop`: `"BusStop"`; `Cafe`: `"Cafe"`; `CarpoolParking`: `"CarpoolParking"`; `FuelStation`: `"FuelStation"`; `Hotel`: `"Hotel"`; `Mall`: `"Mall"`; `MetroStation`: `"MetroStation"`; `Museum`: `"Museum"`; `Nature`: `"Nature"`; `ParkingLot`: `"ParkingLot"`; `RecreationArea`: `"RecreationArea"`; `Restaurant`: `"Restaurant"`; `Sport`: `"Sport"`; `Supermarket`: `"Supermarket"`; `TaxiStand`: `"TaxiStand"`; `TrainStation`: `"TrainStation"`; `TramStop`: `"TramStop"`; `Wifi`: `"Wifi"`; \}\>\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `name`: `ZodString`; `openingHours`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `parkingType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `AlongMotorway`: `"AlongMotorway"`; `OnDriveway`: `"OnDriveway"`; `OnStreet`: `"OnStreet"`; `ParkingGarage`: `"ParkingGarage"`; `ParkingLot`: `"ParkingLot"`; `UndergroundGarage`: `"UndergroundGarage"`; \}\>\>\>; `postalCode`: `ZodString`; `publishUpstream`: `ZodDefault`\<`ZodBoolean`\>; `state`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeZone`: `ZodDefault`\<`ZodString`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `LocationSchema`       | [00_Base/src/interfaces/dto/location.dto.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/location.dto.ts#L43) |
| <a id="property-locationcreate"></a> `LocationCreate` | `ZodObject`\<\{ `address`: `ZodString`; `city`: `ZodString`; `coordinates`: `ZodObject`\<\{ `coordinates`: `ZodArray`\<`ZodNumber`\>; `type`: `ZodLiteral`\<`"Point"`\>; \}, `$strip`\>; `country`: `ZodString`; `facilities`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodEnum`\<\{ `Airport`: `"Airport"`; `BikeSharing`: `"BikeSharing"`; `BusStop`: `"BusStop"`; `Cafe`: `"Cafe"`; `CarpoolParking`: `"CarpoolParking"`; `FuelStation`: `"FuelStation"`; `Hotel`: `"Hotel"`; `Mall`: `"Mall"`; `MetroStation`: `"MetroStation"`; `Museum`: `"Museum"`; `Nature`: `"Nature"`; `ParkingLot`: `"ParkingLot"`; `RecreationArea`: `"RecreationArea"`; `Restaurant`: `"Restaurant"`; `Sport`: `"Sport"`; `Supermarket`: `"Supermarket"`; `TaxiStand`: `"TaxiStand"`; `TrainStation`: `"TrainStation"`; `TramStop`: `"TramStop"`; `Wifi`: `"Wifi"`; \}\>\>\>\>; `name`: `ZodString`; `openingHours`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `parkingType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `AlongMotorway`: `"AlongMotorway"`; `OnDriveway`: `"OnDriveway"`; `OnStreet`: `"OnStreet"`; `ParkingGarage`: `"ParkingGarage"`; `ParkingLot`: `"ParkingLot"`; `UndergroundGarage`: `"UndergroundGarage"`; \}\>\>\>; `postalCode`: `ZodString`; `publishUpstream`: `ZodDefault`\<`ZodBoolean`\>; `state`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timeZone`: `ZodDefault`\<`ZodString`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `LocationCreateSchema` | [00_Base/src/interfaces/dto/location.dto.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/location.dto.ts#L44) |

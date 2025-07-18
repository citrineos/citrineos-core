// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Sampled_ Value. Measurand. Measurand_ Code
 * urn:x-oca:ocpp:uid:1:569263
 * Type of measurement. Default = "Energy.Active.Import.Register"
 *
 */
export enum MeasurandEnumType {
  Current_Export = 'Current.Export',
  Current_Import = 'Current.Import',
  Current_Offered = 'Current.Offered',
  Energy_Active_Export_Register = 'Energy.Active.Export.Register',
  Energy_Active_Import_Register = 'Energy.Active.Import.Register',
  Energy_Reactive_Export_Register = 'Energy.Reactive.Export.Register',
  Energy_Reactive_Import_Register = 'Energy.Reactive.Import.Register',
  Energy_Active_Export_Interval = 'Energy.Active.Export.Interval',
  Energy_Active_Import_Interval = 'Energy.Active.Import.Interval',
  Energy_Active_Net = 'Energy.Active.Net',
  Energy_Reactive_Export_Interval = 'Energy.Reactive.Export.Interval',
  Energy_Reactive_Import_Interval = 'Energy.Reactive.Import.Interval',
  Energy_Reactive_Net = 'Energy.Reactive.Net',
  Energy_Apparent_Net = 'Energy.Apparent.Net',
  Energy_Apparent_Import = 'Energy.Apparent.Import',
  Energy_Apparent_Export = 'Energy.Apparent.Export',
  Frequency = 'Frequency',
  Power_Active_Export = 'Power.Active.Export',
  Power_Active_Import = 'Power.Active.Import',
  Power_Factor = 'Power.Factor',
  Power_Offered = 'Power.Offered',
  Power_Reactive_Export = 'Power.Reactive.Export',
  Power_Reactive_Import = 'Power.Reactive.Import',
  SoC = 'SoC',
  Voltage = 'Voltage',
}

/**
 * This contains the type of this event.
 * The first TransactionEvent of a transaction SHALL contain: "Started" The last TransactionEvent of a transaction SHALL contain: "Ended" All others SHALL contain: "Updated"
 *
 */
export enum TransactionEventEnumType {
  Ended = 'Ended',
  Started = 'Started',
  Updated = 'Updated',
}

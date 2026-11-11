// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { createContext, useContext } from 'react';

const en = {
  'app.title': 'Pay to charge',
  'app.tagline': 'Card payment, no account needed',
  'error.generic': 'Something went wrong. Please try again.',
  'error.network': 'No connection. Please check your network and try again.',
  'action.continue': 'Continue',
  'action.retry': 'Try again',
  'action.refresh': 'Refresh',
  'action.print': 'Print',
  'action.home': 'Find another charger',

  'home.instructions':
    'Scan the QR code on the charger with your phone’s camera, or enter the charger’s EVSE ID.',
  'home.evseId': 'EVSE ID',
  'home.notFound': 'We could not find a charger with that ID.',
  'home.missing': 'Please enter an EVSE ID.',

  'checkout.notFound': 'We could not find this charger.',
  'checkout.operator': 'Operator',
  'checkout.location': 'Location',
  'checkout.offline': 'The charger is offline at the moment.',
  'checkout.notPayable': 'This charger does not take card payments.',
  'checkout.chooseConnector': 'Choose a connector',
  'checkout.connector': 'Connector {number}',
  'checkout.noTariff': 'No price is set for this connector.',
  'checkout.tariff': 'Prices',
  'checkout.perKwh': 'per kWh',
  'checkout.perMin': 'per minute',
  'checkout.perSession': 'per session',
  'checkout.inclVat': 'incl. {rate}% VAT',
  'checkout.hold':
    '{amount} will be reserved on your card. When the session ends, only what it cost is charged and the rest is released.',
  'checkout.plugIn': 'Plug in your vehicle, then pay to start charging.',
  'checkout.acceptTerms': 'I accept the operator’s {terms}.',
  'checkout.terms': 'terms and conditions',
  'checkout.termsRequired': 'Please accept the terms and conditions first.',
  'checkout.pay': 'Pay and charge',
  'checkout.unavailable': 'This connector cannot be used right now.',

  'status.Created.WebPortal': 'The payment was not completed.',
  'status.Created.ScanAndCharge': 'Waiting for your payment.',
  'status.Authorized': 'Payment authorised. Waiting for the charger to start…',
  'status.StartRequested': 'Payment authorised. Waiting for the charger to start…',
  'status.Charging': 'Charging',
  'status.Capturing': 'Session finished',
  'status.Captured': 'Session finished',
  'status.Cancelled': 'Session cancelled',
  'status.Rejected': 'The charger did not start the session.',
  'status.Failed': 'We could not settle this session.',
  'charging.noCharge': 'Nothing was charged. The reserved amount is released from your card.',
  'charging.failedHelp': 'Please contact the operator if your card was charged.',
  'charging.payNow': 'Pay now',
  'charging.cost': 'Cost so far (incl. VAT)',
  'charging.finalCost': 'Charged to your card',
  'charging.time': 'Charging time',
  'charging.energy': 'Energy',
  'charging.lastUpdate': 'Last update {time}',
  'charging.receipt': 'View receipt',
  'charging.notFound': 'We could not find this session.',

  'receipt.title': 'Receipt',
  'receipt.notReady': 'The receipt is available once the session is settled.',
  'receipt.session': 'Session',
  'receipt.evse': 'EVSE ID',
  'receipt.start': 'Start',
  'receipt.end': 'End',
  'receipt.item': 'Item',
  'receipt.quantity': 'Quantity',
  'receipt.unitPrice': 'Unit price (net)',
  'receipt.net': 'Net',
  'receipt.sessionFee': 'Session fee',
  'receipt.energy': 'Energy (kWh)',
  'receipt.time': 'Time (min)',
  'receipt.totalNet': 'Total (net)',
  'receipt.vat': 'VAT {rate}%',
  'receipt.totalGross': 'Total (gross)',
  'receipt.charged': 'Charged to card',
  'receipt.capped': 'Limited to the amount reserved on your card.',
  'receipt.contact': 'For questions about this receipt, contact {operator}.',
};

export type MessageKey = keyof typeof en;

const de: Record<MessageKey, string> = {
  'app.title': 'Bezahlen und laden',
  'app.tagline': 'Kartenzahlung ohne Registrierung',
  'error.generic': 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  'error.network': 'Keine Verbindung. Bitte prüfe dein Netz und versuche es erneut.',
  'action.continue': 'Weiter',
  'action.retry': 'Erneut versuchen',
  'action.refresh': 'Aktualisieren',
  'action.print': 'Drucken',
  'action.home': 'Andere Ladestation suchen',

  'home.instructions':
    'Scanne den QR-Code an der Ladestation mit der Kamera deines Handys oder gib die EVSE-ID der Ladestation ein.',
  'home.evseId': 'EVSE-ID',
  'home.notFound': 'Wir haben keine Ladestation mit dieser ID gefunden.',
  'home.missing': 'Bitte gib eine EVSE-ID ein.',

  'checkout.notFound': 'Wir haben diese Ladestation nicht gefunden.',
  'checkout.operator': 'Betreiber',
  'checkout.location': 'Standort',
  'checkout.offline': 'Die Ladestation ist gerade offline.',
  'checkout.notPayable': 'An dieser Ladestation ist keine Kartenzahlung möglich.',
  'checkout.chooseConnector': 'Wähle einen Anschluss',
  'checkout.connector': 'Anschluss {number}',
  'checkout.noTariff': 'Für diesen Anschluss ist kein Preis hinterlegt.',
  'checkout.tariff': 'Preise',
  'checkout.perKwh': 'pro kWh',
  'checkout.perMin': 'pro Minute',
  'checkout.perSession': 'pro Ladevorgang',
  'checkout.inclVat': 'inkl. {rate} % MwSt.',
  'checkout.hold':
    '{amount} werden auf deiner Karte reserviert. Nach dem Laden wird nur der tatsächliche Betrag abgebucht, der Rest wird freigegeben.',
  'checkout.plugIn': 'Schließe dein Fahrzeug an und bezahle, um den Ladevorgang zu starten.',
  'checkout.acceptTerms': 'Ich akzeptiere die {terms} des Betreibers.',
  'checkout.terms': 'Geschäftsbedingungen',
  'checkout.termsRequired': 'Bitte akzeptiere zuerst die Geschäftsbedingungen.',
  'checkout.pay': 'Bezahlen und laden',
  'checkout.unavailable': 'Dieser Anschluss kann gerade nicht genutzt werden.',

  'status.Created.WebPortal': 'Die Zahlung wurde nicht abgeschlossen.',
  'status.Created.ScanAndCharge': 'Wir warten auf deine Zahlung.',
  'status.Authorized': 'Zahlung autorisiert. Warte auf den Start der Ladestation …',
  'status.StartRequested': 'Zahlung autorisiert. Warte auf den Start der Ladestation …',
  'status.Charging': 'Lädt',
  'status.Capturing': 'Ladevorgang beendet',
  'status.Captured': 'Ladevorgang beendet',
  'status.Cancelled': 'Ladevorgang abgebrochen',
  'status.Rejected': 'Die Ladestation hat den Ladevorgang nicht gestartet.',
  'status.Failed': 'Wir konnten diesen Ladevorgang nicht abrechnen.',
  'charging.noCharge':
    'Es wurde nichts abgebucht. Der reservierte Betrag wird auf deiner Karte freigegeben.',
  'charging.failedHelp': 'Bitte wende dich an den Betreiber, falls deine Karte belastet wurde.',
  'charging.payNow': 'Jetzt bezahlen',
  'charging.cost': 'Bisherige Kosten (inkl. MwSt.)',
  'charging.finalCost': 'Von deiner Karte abgebucht',
  'charging.time': 'Ladedauer',
  'charging.energy': 'Energie',
  'charging.lastUpdate': 'Zuletzt aktualisiert {time}',
  'charging.receipt': 'Beleg anzeigen',
  'charging.notFound': 'Wir haben diesen Ladevorgang nicht gefunden.',

  'receipt.title': 'Beleg',
  'receipt.notReady': 'Der Beleg ist verfügbar, sobald der Ladevorgang abgerechnet ist.',
  'receipt.session': 'Ladevorgang',
  'receipt.evse': 'EVSE-ID',
  'receipt.start': 'Beginn',
  'receipt.end': 'Ende',
  'receipt.item': 'Position',
  'receipt.quantity': 'Menge',
  'receipt.unitPrice': 'Einzelpreis (netto)',
  'receipt.net': 'Netto',
  'receipt.sessionFee': 'Startgebühr',
  'receipt.energy': 'Energie (kWh)',
  'receipt.time': 'Zeit (Min.)',
  'receipt.totalNet': 'Summe (netto)',
  'receipt.vat': 'MwSt. {rate} %',
  'receipt.totalGross': 'Summe (brutto)',
  'receipt.charged': 'Von der Karte abgebucht',
  'receipt.capped': 'Begrenzt auf den auf deiner Karte reservierten Betrag.',
  'receipt.contact': 'Bei Fragen zu diesem Beleg wende dich an {operator}.',
};

const MESSAGES: Record<string, Record<MessageKey, string>> = { en, de };

export interface I18n {
  locale: string;
  t(key: MessageKey, values?: Record<string, string | number>): string;
}

/** The first of the browser's languages there are messages for; English otherwise. */
export function pickLocale(languages: readonly string[]): string {
  for (const language of languages) {
    if (language.split(/[-_]/)[0].toLowerCase() in MESSAGES) {
      return language;
    }
  }
  return 'en';
}

export function createI18n(locale: string): I18n {
  const messages = MESSAGES[locale.split(/[-_]/)[0].toLowerCase()] ?? en;
  return {
    locale,
    t: (key, values = {}) =>
      messages[key].replace(/\{(\w+)\}/g, (match, name: string) =>
        name in values ? String(values[name]) : match,
      ),
  };
}

export const I18nContext = createContext<I18n>(createI18n('en'));

export function useI18n(): I18n {
  return useContext(I18nContext);
}

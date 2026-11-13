// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { redactUrl } from '@base-util/url.js';

describe('redactUrl', () => {
  it('drops the query string', () => {
    expect(redactUrl('http://receiver:8000/ocpp/webhook?token=secret')).toBe(
      'http://receiver:8000/ocpp/webhook',
    );
  });

  it('drops the userinfo', () => {
    expect(redactUrl('https://user:password@receiver/ocpp/webhook')).toBe(
      'https://receiver/ocpp/webhook',
    );
  });

  it('drops the fragment', () => {
    expect(redactUrl('https://receiver/ocpp/webhook#access_token=secret')).toBe(
      'https://receiver/ocpp/webhook',
    );
  });

  it('drops userinfo and query together', () => {
    expect(redactUrl('https://user:password@receiver/ocpp/webhook?token=secret')).toBe(
      'https://receiver/ocpp/webhook',
    );
  });

  it('keeps a URL without credentials unchanged', () => {
    expect(redactUrl('http://receiver:8000/ocpp/webhook')).toBe(
      'http://receiver:8000/ocpp/webhook',
    );
  });

  it('keeps a URL without a path', () => {
    expect(redactUrl('https://user:password@receiver:8000?token=secret')).toBe(
      'https://receiver:8000',
    );
  });

  it('keeps an @ that is in the path rather than the authority', () => {
    expect(redactUrl('https://receiver/users/someone@example.com')).toBe(
      'https://receiver/users/someone@example.com',
    );
  });

  it('drops an @ that is only in the query', () => {
    expect(redactUrl('https://receiver/hook?email=someone@example.com')).toBe(
      'https://receiver/hook',
    );
  });

  it('handles a non-special scheme', () => {
    expect(redactUrl('amqp://user:password@rabbitmq:5672/vhost')).toBe(
      'amqp://rabbitmq:5672/vhost',
    );
  });

  it('strips credentials from a URL without a scheme', () => {
    expect(redactUrl('user:password@receiver/ocpp/webhook?token=secret')).toBe(
      'receiver/ocpp/webhook',
    );
  });

  it('strips the query from a URL a parser would reject', () => {
    expect(redactUrl('receiver/ocpp/webhook?token=secret')).toBe('receiver/ocpp/webhook');
  });
});

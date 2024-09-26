/* eslint-disable @typescript-eslint/no-unused-vars */
 

// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';

/**
 * Utility class to measure time
 */
export class Timer {
  /**
   * Fields
   */
  private readonly timerStart = BigInt(new Date().getTime());
  private timerEnd?: bigint;

  /**
   * Methods
   */

  /**
   * Getter & Setter
   */

  /**
   * Calculates and returns the difference between the timer end and start values.
   *
   * @return {bigint | null} The difference between the timer end and start values, or null if either value is missing.
   */
  get difference(): bigint | null {
    return this.timerEnd ? this.timerEnd - this.timerStart : null;
  }

  /**
   * Ends the timer and returns the time difference.
   *
   * @returns The time difference between the start and end of the timer.
   */
  end(): bigint | null {
    this.timerEnd = BigInt(new Date().getTime());
    return this.difference;
  }
}

export function isPromise<T = unknown>(p: T | Promise<T>): p is Promise<T> {
  if (p instanceof Promise) {
    return true;
  }
  if (
    p !== null &&
    typeof p === 'object' &&
    'then' in p &&
    typeof p.then === 'function' &&
    'catch' in p &&
    typeof p.catch === 'function'
  ) {
    return true;
  }
  return false;
}

/**
 * Decorator function to measure execution time of a function call.
 *
 * @param {Logger<ILogObj>} logger - The logger instance.
 * @param {string} [logPrefix] - The log prefix.
 * @param {number} [logLevel=3] - The log level.
 * @returns {PropertyDescriptor} - The modified property descriptor.
 */
export function Timed(
  logger: Logger<ILogObj>,
  logPrefix?: string,
  logLevel: number = 3,
) {
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    propertyDescriptor =
      propertyDescriptor ||
      Object.getOwnPropertyDescriptor(target, propertyKey);
    const originalMethod = propertyDescriptor.value;

    propertyDescriptor.value = function (...args: unknown[]) {
      const timer = new Timer();
      try {
        const result = originalMethod.apply(this, args);
        if (isPromise(result)) {
          return result.finally(() => timer.end());
        } else {
          timer.end();
          return result;
        }
      } catch (err) {
        timer.end();
        logger.error(logPrefix, err);
      }
    };

    return propertyDescriptor;
  };
}

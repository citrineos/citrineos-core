// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { EventEmitter } from "events";

function EmitsEventAfter<T extends typeof EventEmitter>(constructor: T) {
    return function (eventName: string) {
        return function (target: EventEmitter, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;

            descriptor.value = async function (...args: any[]) {
                const result = await originalMethod.apply(this, args);
                constructor.prototype.emit(eventName, result);
                return result;
            };
        };
    };
}
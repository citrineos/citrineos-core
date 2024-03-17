// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export interface INetworkConnection {
    addOnConnectionCallback(onConnectionCallback: (identifier: string, info?: Map<string, string>) => Promise<boolean>): void;
    addOnCloseCallback(onConnectionCallback: (identifier: string, info?: Map<string, string>) => Promise<boolean>): void;
    addOnMessageCallback(onMessageCallback: (identifier: string, message: string, info?: Map<string, string>) => Promise<boolean>): void;
    sendMessage(identifier: string, message: string): Promise<boolean>;
    shutdown(): void;
}
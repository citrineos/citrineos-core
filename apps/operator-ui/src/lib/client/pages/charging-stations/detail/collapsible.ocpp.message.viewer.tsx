// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Copy, Plus } from 'lucide-react';
import { MessageTypeId, type OCPPMessageDto } from '@citrineos/base';
import { Button } from '@lib/client/components/ui/button';
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { buttonIconSize } from '@lib/client/styles/icon';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@lib/client/components/ui/sheet';
import { ScrollArea } from '@ferdiunal/refine-shadcn/ui';
import { copy } from '@lib/utils/copy';
import { formatDate } from '@lib/client/components/timestamp-display';
import { useTranslate } from '@refinedev/core';

export const CollapsibleOCPPMessageViewer: React.FC<{
  ocppMessageDto: OCPPMessageDto;
  unparsed?: boolean;
}> = ({ ocppMessageDto, unparsed }) => {
  const translate = useTranslate();
  const [open, setOpen] = useState(false);
  const threshold = 7;

  const ocppMessage = ocppMessageDto.message;
  const correlationId = ocppMessageDto.correlationId;
  const timestamp = ocppMessageDto.timestamp;
  const action = ocppMessageDto.action;
  const origin = ocppMessageDto.origin;

  let payload;
  if (unparsed) {
    payload = JSON.stringify(ocppMessage);
  } else {
    switch (ocppMessage[0]) {
      case MessageTypeId.Call:
        payload = ocppMessage[3];
        break;
      case MessageTypeId.CallResult:
        payload = ocppMessage[2];
        break;
      case MessageTypeId.CallError: {
        const [_messageTypeId, _messageId, errorCode, errorDescription, errorDetails] = ocppMessage;
        payload = { errorCode, errorDescription, errorDetails };
        break;
      }
      default:
        payload = ocppMessage;
        break;
    }
  }

  const formattedJson = JSON.stringify(payload, null, 2);
  const lines = formattedJson.split('\n');
  const isExpandable = lines.length > threshold;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="relative">
        <SyntaxHighlighter
          language="json"
          style={okaidia}
          codeTagProps={{
            style: {
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            },
          }}
          customStyle={{
            fontSize: '0.8rem',
            padding: '0.5rem',
            borderRadius: '4px',
            maxHeight: '250px',
            margin: 0,
          }}
          wrapLongLines
        >
          {isExpandable ? lines.slice(0, threshold).join('\n') : formattedJson}
        </SyntaxHighlighter>

        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={async (e) => {
            e.stopPropagation();
            await copy(JSON.stringify(ocppMessage, null, 2), false, translate);
          }}
          className={`absolute top-1 ${isExpandable ? 'right-8' : 'right-1'} p-1`}
        >
          <Copy className={buttonIconSize} />
        </Button>

        {isExpandable && (
          <SheetTrigger asChild>
            <Button type="button" size="xs" className="absolute top-1 right-1 p-1">
              <Plus className={buttonIconSize} />
            </Button>
          </SheetTrigger>
        )}
      </div>
      <SheetContent className="min-w-1/3 pb-30" showCloseButton={false}>
        {correlationId && (
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">
              <div className="flex items-center gap-1">
                {correlationId}{' '}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await copy(correlationId, true, translate);
                  }}
                >
                  <Copy className={buttonIconSize} />
                </Button>
              </div>
            </SheetTitle>
            <SheetDescription className="text-base">
              <span className="font-semibold">
                {action} - {origin}
              </span>{' '}
              @ {formatDate(timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
            </SheetDescription>
          </SheetHeader>
        )}
        <ScrollArea className="px-4 size-full relative">
          <SyntaxHighlighter
            language="json"
            style={okaidia}
            codeTagProps={{
              style: {
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              },
            }}
            customStyle={{
              fontSize: '0.8rem',
              padding: '0.5rem',
              borderRadius: '4px',
              maxWidth: '100%',
            }}
            wrapLongLines
          >
            {formattedJson}
          </SyntaxHighlighter>
          <Button
            variant="secondary"
            size="xs"
            onClick={async (e) => {
              e.stopPropagation();
              await copy(JSON.stringify(ocppMessage, null, 2), false, translate);
            }}
            className="absolute top-4 right-6 p-1"
          >
            <Copy className={buttonIconSize} />
          </Button>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

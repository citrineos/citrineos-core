// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion } from '@citrineos/base';
import { Badge } from '@lib/client/components/ui/badge';
import { cn } from '@lib/utils/cn';
import { useTranslate } from '@refinedev/core';

const ProtocolTag = ({ protocol }: { protocol: string | null | undefined }) => {
  const translate = useTranslate();
  let colorClass: string;
  let protocolName: string;

  switch (protocol) {
    case OCPPVersion.OCPP1_6:
      colorClass = 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-cyan-200';
      protocolName = 'OCPP 1.6';
      break;
    case OCPPVersion.OCPP2_0_1:
      colorClass = 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200';
      protocolName = 'OCPP 2.0.1';
      break;
    case OCPPVersion.OCPP2_1:
      colorClass = 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200';
      protocolName = 'OCPP 2.1';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200';
      protocolName = translate('Common.unknown');
      break;
  }

  return (
    <Badge variant="outline" className={cn(colorClass)}>
      {protocolName}
    </Badge>
  );
};

export default ProtocolTag;

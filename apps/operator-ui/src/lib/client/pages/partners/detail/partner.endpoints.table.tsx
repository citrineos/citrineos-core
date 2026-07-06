// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Button } from '@lib/client/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lib/client/components/ui/dialog';
import { Input } from '@lib/client/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@lib/client/components/ui/alert-dialog';
import { PARTNER_UPDATE_MUTATION } from '@lib/queries/tenant.partners';
import { useCustomMutation, useTranslate } from '@refinedev/core';
import { Edit, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { buttonIconSize } from '@lib/client/styles/icon';

interface Endpoint {
  identifier: string;
  url: string;
}

interface PartnerEndpointsTableProps {
  partnerId: number | undefined;
  endpoints: Endpoint[];
  partnerProfileOCPI: any;
}

export const PartnerEndpointsTable: React.FC<PartnerEndpointsTableProps> = ({
  partnerId,
  endpoints,
  partnerProfileOCPI,
}) => {
  const [data, setData] = useState<Endpoint[]>(endpoints || []);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState({ identifier: '', url: '' });
  const [errors, setErrors] = useState({ identifier: '', url: '' });
  const translate = useTranslate();

  useEffect(() => {
    setData(endpoints || []);
  }, [endpoints]);

  const {
    mutate,
    mutation: { isPending: isLoading },
  } = useCustomMutation();

  const edit = (record: Endpoint) => {
    setFormData({ identifier: record.identifier, url: record.url });
    setEditingKey(record.identifier);
    setModalVisible(true);
    setErrors({ identifier: '', url: '' });
  };

  const cancel = () => {
    setEditingKey(null);
    setModalVisible(false);
    setFormData({ identifier: '', url: '' });
    setErrors({ identifier: '', url: '' });
  };

  const isValidPartnerId = typeof partnerId === 'number' && partnerId > 0;

  const validateForm = () => {
    const newErrors = { identifier: '', url: '' };
    let isValid = true;

    if (!formData.identifier.trim()) {
      newErrors.identifier = translate('TenantPartners.endpoints.errorIdentifierRequired');
      isValid = false;
    }
    if (!formData.url.trim()) {
      newErrors.url = translate('TenantPartners.endpoints.errorUrlRequired');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const save = async () => {
    if (!isValidPartnerId || !validateForm()) return;

    const newData = [...data];
    if (editingKey) {
      const index = newData.findIndex((item) => item.identifier === editingKey);
      if (index > -1) {
        newData[index] = formData;
      }
    } else {
      newData.push(formData);
    }
    setData(newData);
    setEditingKey(null);
    setModalVisible(false);
    setFormData({ identifier: '', url: '' });
    updateEndpoints(newData);
  };

  const updateEndpoints = (newEndpoints: Endpoint[]) => {
    if (!isValidPartnerId) {
      return;
    }
    mutate({
      url: '', // Required by useCustomMutation, not used for GraphQL
      method: 'post', // Required by useCustomMutation
      values: {}, // Required by useCustomMutation
      meta: {
        gqlMutation: PARTNER_UPDATE_MUTATION,
        gqlVariables: {
          id: partnerId,
          object: {
            partnerProfileOCPI: {
              ...partnerProfileOCPI,
              endpoints: newEndpoints,
            },
          },
        },
      },
    });
  };

  const handleDelete = (identifier: string) => {
    if (!isValidPartnerId) return;
    const newData = data.filter((item) => item.identifier !== identifier);
    setData(newData);
    updateEndpoints(newData);
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="mb-4">
        <Button
          variant="success"
          size="sm"
          onClick={() => {
            setEditingKey(null);
            setModalVisible(true);
            setFormData({ identifier: '', url: '' });
            setErrors({ identifier: '', url: '' });
          }}
          disabled={!isValidPartnerId}
        >
          <Plus className={buttonIconSize} />
          {translate('buttons.add')} {translate('TenantPartners.endpoints.endpoint')}
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                {translate('TenantPartners.endpoints.identifier')}
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                {translate('TenantPartners.endpoints.url')}
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                {translate('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="h-24 text-center text-muted-foreground">
                  {translate('TenantPartners.endpoints.noEndpointsFound')}
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr key={record.identifier} className="border-b">
                  <td className="p-4 align-middle">{record.identifier}</td>
                  <td className="p-4 align-middle">
                    <a
                      href={record.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {record.url}
                    </a>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => edit(record)}
                        disabled={!isValidPartnerId}
                      >
                        <Edit className={buttonIconSize} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteTarget(record.identifier)}
                        disabled={!isValidPartnerId}
                      >
                        <Trash2 className={buttonIconSize} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {translate(`actions.${editingKey ? 'edit' : 'create'}`)}{' '}
              {translate('TenantPartners.endpoints.endpoint')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {translate('TenantPartners.endpoints.identifier')}
              </label>
              <Input
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                disabled={!!editingKey}
                placeholder={translate('TenantPartners.endpoints.placeholderIdentifier')}
              />
              {errors.identifier && <p className="text-sm text-destructive">{errors.identifier}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {translate('TenantPartners.endpoints.url')}
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder={translate('TenantPartners.endpoints.placeholderUrl')}
              />
              {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancel}>
              {translate('buttons.cancel')}
            </Button>
            <Button onClick={save} disabled={isLoading}>
              {translate(`buttons.${isLoading ? 'saving' : 'save'}`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translate('actions.delete')} {translate('TenantPartners.endpoints.endpoint')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translate('TenantPartners.endpoints.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {translate('buttons.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)}>
              {translate('buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

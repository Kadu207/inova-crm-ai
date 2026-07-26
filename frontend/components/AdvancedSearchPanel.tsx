'use client';

import { FormEvent, useState } from 'react';
import { apiFetch, unwrapList, type ListEnvelope } from '@/lib/api';

type Props<T> = {
  resource: 'leads' | 'contacts' | 'opportunities';
  onResult: (rows: T[]) => void;
  onError: (message: string) => void;
};

const EXAMPLES: Record<Props<unknown>['resource'], string> = {
  leads: JSON.stringify(
    {
      filter: {
        and: [
          { field: 'status', op: 'eq', value: 'NEW' },
          { field: 'title', op: 'contains', value: '' },
        ],
      },
      page: 1,
      pageSize: 20,
    },
    null,
    2,
  ),
  contacts: JSON.stringify(
    { filter: { field: 'name', op: 'contains', value: '' }, page: 1, pageSize: 20 },
    null,
    2,
  ),
  opportunities: JSON.stringify(
    { filter: { field: 'status', op: 'eq', value: 'OPEN' }, page: 1, pageSize: 20 },
    null,
    2,
  ),
};

export function AdvancedSearchPanel<T>({ resource, onResult, onError }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState(EXAMPLES[resource]);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = JSON.parse(json) as unknown;
      const result = await apiFetch<ListEnvelope<T> | T[]>(`/${resource}/search`, {
        method: 'POST',
        body,
      });
      setBusy(false);
      if (!result.ok) {
        onError(result.error.message);
        return;
      }
      onResult(unwrapList(result.data));
    } catch {
      setBusy(false);
      onError('JSON de filtro inválido');
    }
  }

  return (
    <div className="mb-4">
      <button type="button" className="btn-ghost text-sm" onClick={() => setOpen((v) => !v)}>
        {open ? 'Ocultar filtro avançado' : 'Filtro avançado (JSON)'}
      </button>
      {open ? (
        <form className="mt-2 space-y-2" onSubmit={onSubmit}>
          <textarea
            className="min-h-[140px] w-full rounded border border-line bg-void p-3 font-mono text-xs text-bone"
            value={json}
            onChange={(e) => setJson(e.target.value)}
            spellCheck={false}
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            Aplicar busca
          </button>
        </form>
      ) : null}
    </div>
  );
}

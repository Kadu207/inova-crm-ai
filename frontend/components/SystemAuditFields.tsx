'use client';

export type AuditUser = { id: string; name: string; email: string };

type Props = {
  createdBy?: AuditUser | null;
  updatedBy?: AuditUser | null;
  assignedTo?: AuditUser | null;
  createdAt?: string;
  updatedAt?: string;
};

function label(u?: AuditUser | null): string {
  if (!u) return '—';
  return u.name || u.email || u.id;
}

export function SystemAuditFields({
  createdBy,
  updatedBy,
  assignedTo,
  createdAt,
  updatedAt,
}: Props) {
  return (
    <section className="mt-6 border-t border-[var(--border)] pt-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Sistema</h2>
      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        {assignedTo !== undefined ? (
          <>
            <dt className="text-[var(--muted)]">Responsável</dt>
            <dd>{label(assignedTo)}</dd>
          </>
        ) : null}
        <dt className="text-[var(--muted)]">Criado por</dt>
        <dd>
          {label(createdBy)}
          {createdAt ? ` · ${new Date(createdAt).toLocaleString('pt-BR')}` : ''}
        </dd>
        <dt className="text-[var(--muted)]">Atualizado por</dt>
        <dd>
          {label(updatedBy)}
          {updatedAt ? ` · ${new Date(updatedAt).toLocaleString('pt-BR')}` : ''}
        </dd>
      </dl>
    </section>
  );
}

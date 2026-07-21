'use client';

type ConfirmDeleteModalProps = {
  open: boolean;
  busy?: boolean;
  title?: string;
  entityLabel: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  open,
  busy,
  title = 'Excluir registro',
  entityLabel,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Fechar"
        onClick={onClose}
        disabled={busy}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        className="relative z-10 w-full max-w-md rounded-t-lg border border-line bg-panel p-4 shadow-elevated sm:rounded-lg sm:p-6"
      >
        <h2 id="confirm-delete-title" className="font-display text-lg text-bone">
          {title}
        </h2>
        <p className="mt-3 text-sm text-smoke">
          Tem certeza que deseja excluir <span className="text-bone">{entityLabel}</span>? Esta acao
          nao pode ser desfeita.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary bg-bad hover:bg-bad/90"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Excluindo\u2026' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}

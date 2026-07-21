import { PageHeader } from '@/components/PageHeader';

const SETTINGS = [
  { key: 'tenant', label: 'Dados do tenant', value: 'tenant-demo' },
  { key: 'timezone', label: 'Fuso horario', value: 'America/Sao_Paulo' },
  { key: 'chatwoot', label: 'Chatwoot account_id', value: '\u2014' },
  { key: 'webhooks', label: 'Webhooks ativos', value: '0' },
];

export default function ConfiguracoesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title={'Configura\u00e7\u00f5es'}
        description={'Prefer\u00eancias do tenant e integra\u00e7\u00f5es.'}
        action={<button className="btn-primary">Salvar</button>}
      />
      <div className="card-panel divide-y divide-line">
        {SETTINGS.map((setting) => (
          <div
            key={setting.key}
            className="flex flex-wrap items-center justify-between gap-2 py-4 first:pt-0 last:pb-0"
          >
            <span className="text-sm text-smoke">{setting.label}</span>
            <span className="text-sm text-bone">{setting.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

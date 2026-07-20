#!/usr/bin/env node
/**
 * Inova CRM AI — cross-platform quality gate orchestrator.
 *
 * Usage:
 *   node infrastructure/scripts/quality-gate.mjs [--phase=0|1|4] [--task=slug] [--soft]
 *
 * Emits GATE_PASS or GATE_FAIL on stdout. Writes report to reports/quality-gate/.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const phaseArg = args.find((a) => a.startsWith('--phase='));
const taskArg = args.find((a) => a.startsWith('--task='));
const softMode = args.includes('--soft') || phaseArg === '--phase=0';

const explicitPhase = phaseArg ? Number.parseInt(phaseArg.split('=')[1], 10) : null;
const taskSlug = taskArg ? taskArg.split('=')[1] : null;

/** @typedef {{ name: string, status: 'PASS'|'FAIL'|'SKIP'|'WARN', detail?: string, requiredPhase?: number }} StepResult */

function resolveCommand(cmd) {
  if (process.platform === 'win32' && (cmd === 'npm' || cmd === 'npx')) {
    return cmd;
  }
  if (process.platform === 'win32') {
    if (cmd === 'npm') return 'npm.cmd';
    if (cmd === 'npx') return 'npx.cmd';
  }
  return cmd;
}

function usesShell(cmd, explicit) {
  if (explicit !== undefined) return explicit;
  return process.platform === 'win32' && (cmd === 'npm' || cmd === 'npx');
}

/**
 * @param {string} cmd
 * @param {string[]} cmdArgs
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, shell?: boolean }} [opts]
 */
function run(cmd, cmdArgs, opts = {}) {
  const result = spawnSync(resolveCommand(cmd), cmdArgs, {
    cwd: opts.cwd ?? ROOT,
    env: { ...process.env, ...opts.env },
    encoding: 'utf8',
    shell: usesShell(cmd, opts.shell),
  });
  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  };
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

function detectPhase() {
  if (exists('DEPLOY-HETZNER.md') && exists('docs/runbook-saas.md')) return 7;
  if (exists('ai-services/app/main.py')) return 6;
  if (exists('backend/src/finance') || exists('backend/src/finance/finance.service.ts')) return 5;
  if (exists('backend/prisma/schema.prisma')) return 4;
  if (exists('n8n/workflows/lead-inbound.json')) return 3;
  if (exists('chatwoot/docker-compose.yml')) return 2;
  if (exists('infrastructure/docker-compose.yml')) return 1;
  return 0;
}

const phase = Number.isFinite(explicitPhase) ? explicitPhase : detectPhase();

function shouldEnforce(stepPhase) {
  if (softMode) return false;
  return phase >= stepPhase;
}

/** @type {StepResult[]} */
const results = [];

/**
 * @param {string} name
 * @param {'PASS'|'FAIL'|'SKIP'|'WARN'} status
 * @param {string} [detail]
 */
function record(name, status, detail = '') {
  results.push({ name, status, detail });
  const suffix = detail ? ` — ${detail}` : '';
  console.log(`[${status}] ${name}${suffix}`);
}

function fileExistsStep(name, relPaths, requiredPhase = 0) {
  const missing = relPaths.filter((p) => !exists(p));
  if (missing.length === 0) {
    record(name, 'PASS');
    return true;
  }
  const detail = `missing: ${missing.join(', ')}`;
  if (shouldEnforce(requiredPhase)) {
    record(name, 'FAIL', detail);
    return false;
  }
  record(name, 'WARN', detail);
  return softMode;
}

function stepPorts() {
  const script =
    process.platform === 'win32'
      ? path.join(ROOT, 'infrastructure/scripts/check-ports.ps1')
      : path.join(ROOT, 'infrastructure/scripts/check-ports.sh');

  if (process.platform === 'win32') {
    const r = run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], {
      shell: false,
    });
    if (r.ok) {
      record('ports', 'PASS');
      return true;
    }
    record('ports', 'FAIL', r.stderr || r.stdout || `exit ${r.status}`);
    return false;
  }

  const r = run('bash', [script]);
  if (r.ok) {
    record('ports', 'PASS');
    return true;
  }
  record('ports', 'FAIL', r.stderr || r.stdout || `exit ${r.status}`);
  return false;
}

function stepComposeConfig() {
  if (!exists('infrastructure/docker-compose.yml')) {
    record('compose-config', shouldEnforce(1) ? 'FAIL' : 'WARN', 'docker-compose.yml missing');
    return !shouldEnforce(1);
  }

  const composeDir = path.join(ROOT, 'infrastructure');
  const envExample = path.join(composeDir, '.env.example');

  const files = ['--env-file', envExample, '-f', 'docker-compose.yml'];
  if (exists('infrastructure/docker-compose.dev.yml')) {
    files.push('-f', 'docker-compose.dev.yml');
  }

  const r = run('docker', ['compose', ...files, 'config', '--quiet'], { cwd: composeDir });
  if (r.ok) {
    record('compose-config', 'PASS');
    return true;
  }
  const detail = r.stderr || r.stdout || `exit ${r.status}`;
  if (shouldEnforce(1)) {
    record('compose-config', 'FAIL', detail);
    return false;
  }
  record('compose-config', 'WARN', detail);
  return true;
}

function npmScriptAvailable(name) {
  try {
    const pkg = readJson('package.json');
    return Boolean(pkg.scripts?.[name]);
  } catch {
    return false;
  }
}

function workspaceHasScript(workspace, scriptName) {
  const pkgPath = `${workspace}/package.json`;
  if (!exists(pkgPath)) return false;
  try {
    const pkg = readJson(pkgPath);
    return Boolean(pkg.scripts?.[scriptName]);
  } catch {
    return false;
  }
}

function runNpmScript(name, requiredPhase, skipReason) {
  if (!npmScriptAvailable(name) && name !== 'format:check') {
    if (shouldEnforce(requiredPhase)) {
      record(name, 'FAIL', `npm script "${name}" not defined`);
      return false;
    }
    record(name, 'SKIP', skipReason ?? `not required for phase ${phase}`);
    return true;
  }

  if (name === 'format:check' && !npmScriptAvailable('format:check')) {
    if (!exists('package.json')) {
      record('format', 'SKIP', 'no root package.json');
      return true;
    }
    const r = run('npx', ['prettier', '--check', '.'], { cwd: ROOT });
    if (r.ok) {
      record('format', 'PASS');
      return true;
    }
    if (shouldEnforce(requiredPhase)) {
      record('format', 'FAIL', r.stderr || r.stdout);
      return false;
    }
    record('format', 'WARN', r.stderr || r.stdout);
    return true;
  }

  const r = run('npm', ['run', name], { cwd: ROOT });
  if (r.ok) {
    record(name === 'format:check' ? 'format' : name, 'PASS');
    return true;
  }

  const output = r.stderr || r.stdout;
  if (name === 'lint' && !workspaceHasScript('backend', 'lint') && phase < 4) {
    record('lint', 'SKIP', 'backend lint not expected before phase 4');
    return true;
  }

  if (shouldEnforce(requiredPhase)) {
    record(name === 'format:check' ? 'format' : name, 'FAIL', output);
    return false;
  }
  record(name === 'format:check' ? 'format' : name, 'WARN', output);
  return true;
}

function stepPrismaValidate() {
  const schema = 'backend/prisma/schema.prisma';
  if (!exists(schema)) {
    record('prisma-validate', 'SKIP', 'no prisma schema yet');
    return true;
  }
  const r = run('npx', ['prisma', 'validate', '--schema', schema]);
  if (r.ok) {
    record('prisma-validate', 'PASS');
    return true;
  }
  if (shouldEnforce(4)) {
    record('prisma-validate', 'FAIL', r.stderr || r.stdout);
    return false;
  }
  record('prisma-validate', 'WARN', r.stderr || r.stdout);
  return true;
}

function stepTestScript(scriptName, label, requiredPhase) {
  if (!workspaceHasScript('backend', scriptName) && !npmScriptAvailable(scriptName)) {
    record(label, 'SKIP', `${scriptName} not configured`);
    return true;
  }
  const r = run('npm', ['run', scriptName], { cwd: ROOT });
  if (r.ok) {
    record(label, 'PASS');
    return true;
  }
  if (shouldEnforce(requiredPhase)) {
    record(label, 'FAIL', r.stderr || r.stdout);
    return false;
  }
  record(label, 'WARN', r.stderr || r.stdout);
  return true;
}

function stepE2E() {
  const hasPlaywright =
    exists('playwright.config.ts') ||
    exists('playwright.config.js') ||
    exists('frontend/playwright.config.ts') ||
    exists('e2e/playwright.config.ts');

  if (!hasPlaywright) {
    record('e2e', 'WARN', 'no Playwright config — skipped');
    return true;
  }
  return stepTestScript('test:e2e', 'e2e', 5);
}

function stepSecurityAudit() {
  if (!exists('package.json')) {
    record('security-audit', 'SKIP', 'no package.json');
    return true;
  }
  const r = run('npm', ['audit', '--audit-level=high', '--omit=dev'], { cwd: ROOT });
  if (r.ok) {
    record('security-audit', 'PASS');
    return true;
  }
  const hasWaiver = exists('docs/security/npm-audit-waivers.md');
  if (hasWaiver) {
    record(
      'security-audit',
      'WARN',
      'high findings present — waived via docs/security/npm-audit-waivers.md',
    );
    return true;
  }
  if (shouldEnforce(2)) {
    record('security-audit', 'FAIL', r.stderr || r.stdout);
    return false;
  }
  record('security-audit', 'WARN', r.stderr || r.stdout);
  return true;
}

function stepAiPytest() {
  if (!exists('ai-services/requirements.txt')) {
    record('ai-pytest', 'SKIP', 'ai-services not present');
    return true;
  }
  const r = run('python', ['-m', 'pytest', '-q'], {
    cwd: path.join(ROOT, 'ai-services'),
  });
  if (r.ok) {
    record('ai-pytest', 'PASS');
    return true;
  }
  if (shouldEnforce(6)) {
    record('ai-pytest', 'FAIL', r.stderr || r.stdout);
    return false;
  }
  record('ai-pytest', 'WARN', r.stderr || r.stdout || 'pytest not green yet');
  return true;
}

function stepChatwootN8nArtifacts() {
  const required = [
    'chatwoot/docker-compose.yml',
    'chatwoot/docker-compose.evolution.yml',
    'chatwoot/scripts/create_whatsapp_inbox.rb',
    'chatwoot/scripts/setup-evolution-instance.sh',
    'n8n/workflows/lead-inbound.json',
    'docs/integracao-chatwoot.md',
    'docs/integracao-n8n.md',
    'docs/webhook-signing.md',
    'docs/chatwoot-whatsapp-setup.md',
    'docs/adr/005-whatsapp-evolution-transitional.md',
  ];
  const missing = required.filter((p) => !exists(p));
  if (missing.length === 0) {
    record('chatwoot-n8n-artifacts', 'PASS');
    return true;
  }
  if (shouldEnforce(3)) {
    record('chatwoot-n8n-artifacts', 'FAIL', `missing: ${missing.join(', ')}`);
    return false;
  }
  record('chatwoot-n8n-artifacts', 'WARN', `missing: ${missing.join(', ')}`);
  return true;
}

function stepDeliveryArtifacts() {
  const required = [
    'DEPLOY-HETZNER.md',
    'docs/manual-implantacao-producao.md',
    'infrastructure/cloudflare-tunnel-ingress.example.yml',
    'infrastructure/scripts/backup.sh',
    'infrastructure/scripts/deploy-vps.ps1',
  ];
  const missing = required.filter((p) => !exists(p));
  if (missing.length === 0) {
    record('delivery-artifacts', 'PASS');
    return true;
  }
  if (shouldEnforce(7)) {
    record('delivery-artifacts', 'FAIL', `missing: ${missing.join(', ')}`);
    return false;
  }
  record('delivery-artifacts', 'WARN', `missing: ${missing.join(', ')}`);
  return true;
}

function stepDocsSync() {
  const required = [
    'docs/README.md',
    'docs/architecture/overview.md',
    'docs/operations/quality-gate.md',
    '.specify/memory/constitution.md',
  ];
  const missing = required.filter((p) => !exists(p));
  if (missing.length === 0) {
    record('docs-sync', 'PASS');
    return true;
  }
  const detail = `missing: ${missing.join(', ')}`;
  if (shouldEnforce(0)) {
    record('docs-sync', 'FAIL', detail);
    return false;
  }
  record('docs-sync', 'WARN', detail);
  return true;
}

function stepConstitution() {
  return fileExistsStep('constitution', ['.specify/memory/constitution.md'], 0);
}

function stepEnvExample() {
  return fileExistsStep('env-example', ['.env.example', 'infrastructure/.env.example'], 0);
}

function writeReport() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = taskSlug ? `${ts}-${taskSlug}` : ts;
  const reportDir = path.join(ROOT, 'reports/quality-gate');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `${slug}.md`);

  const fails = results.filter((r) => r.status === 'FAIL');
  const warns = results.filter((r) => r.status === 'WARN');
  const passes = results.filter((r) => r.status === 'PASS');
  const skips = results.filter((r) => r.status === 'SKIP');
  const overall = fails.length === 0 ? 'PASS' : 'FAIL';

  const lines = [
    '# Quality Gate Report',
    '',
    `- **Timestamp:** ${new Date().toISOString()}`,
    `- **Phase:** ${phase}${softMode ? ' (soft mode)' : ''}`,
    `- **Task:** ${taskSlug ?? '—'}`,
    `- **Result:** ${overall}`,
    '',
    '## Summary',
    '',
    `| Status | Count |`,
    `|--------|-------|`,
    `| PASS | ${passes.length} |`,
    `| FAIL | ${fails.length} |`,
    `| WARN | ${warns.length} |`,
    `| SKIP | ${skips.length} |`,
    '',
    '## Steps',
    '',
    ...results.map((r) => {
      const detail = r.detail ? ` — ${r.detail}` : '';
      return `- **${r.status}** \`${r.name}\`${detail}`;
    }),
    '',
  ];

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`Report: ${path.relative(ROOT, reportPath)}`);
  return { overall, reportPath };
}

console.log(`Quality Gate — phase ${phase}${softMode ? ' (soft)' : ''}`);
console.log('---');

const steps = [
  () => stepPorts(),
  () => stepConstitution(),
  () => stepEnvExample(),
  () => stepDocsSync(),
  () => stepComposeConfig(),
  () => stepChatwootN8nArtifacts(),
  () => runNpmScript('format:check', 2, 'format check optional before phase 2'),
  () => runNpmScript('lint', 4, 'lint optional before phase 4'),
  () => runNpmScript('typecheck', 4, 'typecheck optional before phase 4'),
  () => stepPrismaValidate(),
  () => stepTestScript('test:unit', 'unit', 4),
  () => stepTestScript('test:contract', 'contract', 4),
  () => stepE2E(),
  () => stepSecurityAudit(),
  () => stepAiPytest(),
  () => stepDeliveryArtifacts(),
];

let allOk = true;
for (const step of steps) {
  if (!step()) allOk = false;
}

writeReport();

console.log('---');
if (allOk) {
  console.log('GATE_PASS');
  process.exit(0);
}

console.log('GATE_FAIL');
process.exit(1);

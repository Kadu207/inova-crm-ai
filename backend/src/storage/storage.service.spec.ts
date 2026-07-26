import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StorageService } from './storage.service';

describe('StorageService (local driver)', () => {
  let root: string;
  let service: StorageService;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'inova-storage-'));
    const config = {
      get: (key: string) => {
        if (key === 'BULK_STORAGE_DIR') return root;
        return undefined;
      },
    } as ConfigService;
    service = new StorageService(config);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes and reads tenant-prefixed object on disk', async () => {
    expect(service.driver).toBe('local');
    await service.putObject('tenant-a/bulk/job1.csv', 'id,title\n1,x');
    const text = await service.getObjectText('tenant-a/bulk/job1.csv');
    expect(text).toContain('title');
    const onDisk = await readFile(join(root, 'tenant-a', 'bulk', 'job1.csv'), 'utf8');
    expect(onDisk).toBe(text);
  });

  it('rejects keys without tenant prefix', async () => {
    await expect(service.putObject('no-prefix.csv', 'x')).rejects.toThrow(/tenantId/);
  });
});

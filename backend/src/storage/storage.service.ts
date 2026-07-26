import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * Object storage for tenant-scoped blobs (bulk CSV, future attachments).
 * Prefers MinIO/S3 when MINIO_ENDPOINT + credentials are set; otherwise local disk.
 * Keys must start with `{tenantId}/` (ADR 002).
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly localRoot: string;
  readonly driver: 'minio' | 'local';

  constructor(private readonly config: ConfigService) {
    const endpointRaw = this.config.get<string>('MINIO_ENDPOINT')?.trim() ?? '';
    const accessKey =
      this.config.get<string>('MINIO_ACCESS_KEY')?.trim() ||
      this.config.get<string>('MINIO_ROOT_USER')?.trim() ||
      '';
    const secretKey =
      this.config.get<string>('MINIO_SECRET_KEY')?.trim() ||
      this.config.get<string>('MINIO_ROOT_PASSWORD')?.trim() ||
      '';
    this.bucket =
      this.config.get<string>('MINIO_BUCKET')?.trim() ||
      this.config.get<string>('MINIO_BUCKET_NAME')?.trim() ||
      'inova-crm';
    this.localRoot =
      this.config.get<string>('BULK_STORAGE_DIR')?.trim() || join(process.cwd(), '.data', 'bulk');

    if (endpointRaw && accessKey && secretKey) {
      const useSsl = this.config.get<string>('MINIO_USE_SSL') === 'true';
      const withScheme = endpointRaw.includes('://')
        ? endpointRaw
        : `${useSsl ? 'https' : 'http'}://${endpointRaw}`;
      this.client = new S3Client({
        region: this.config.get<string>('MINIO_REGION') || 'us-east-1',
        endpoint: withScheme,
        forcePathStyle: true,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      });
      this.driver = 'minio';
    } else {
      this.client = null;
      this.driver = 'local';
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.client) {
      this.logger.warn(`Storage driver=local root=${this.localRoot}`);
      return;
    }
    try {
      await this.ensureBucket();
      this.logger.log(`Storage driver=minio bucket=${this.bucket}`);
    } catch (err) {
      this.logger.error(
        `MinIO bucket check failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async putObject(key: string, body: string | Buffer, contentType = 'text/csv'): Promise<void> {
    this.assertTenantKey(key);
    if (this.client) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: typeof body === 'string' ? Buffer.from(body, 'utf8') : body,
          ContentType: contentType,
        }),
      );
      return;
    }
    const full = join(this.localRoot, key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, body, typeof body === 'string' ? 'utf8' : undefined);
  }

  async getObjectText(key: string): Promise<string> {
    this.assertTenantKey(key);
    if (this.client) {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      if (!res.Body) {
        throw new Error(`Empty object body for key=${key}`);
      }
      return res.Body.transformToString('utf8');
    }
    return readFile(join(this.localRoot, key), 'utf8');
  }

  private assertTenantKey(key: string): void {
    if (!key || key.includes('..') || key.startsWith('/')) {
      throw new Error('Invalid storage key');
    }
    // ADR 002: prefix by tenantId
    if (!/^[a-zA-Z0-9_-]+\//.test(key)) {
      throw new Error('Storage key must be prefixed with tenantId/');
    }
  }

  private async ensureBucket(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }
}

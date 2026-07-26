import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BulkJob, BulkJobStatus, BulkJobType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { notDeleted } from '../common/soft-delete';
import { CreateBulkExportDto, CreateBulkImportDto } from './dto/bulk.dto';

const MAX_ROWS = 5_000;

@Injectable()
export class BulkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  findAll(tenantId: string): Promise<BulkJob[]> {
    return this.prisma.bulkJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(tenantId: string, id: string): Promise<BulkJob> {
    const job = await this.prisma.bulkJob.findFirst({ where: { id, tenantId } });
    if (!job) throw new NotFoundException(`BulkJob ${id} not found`);
    return job;
  }

  async startExport(
    tenantId: string,
    dto: CreateBulkExportDto,
    actorUserId?: string,
  ): Promise<BulkJob> {
    const module = dto.module.toLowerCase();
    if (!['leads', 'contacts', 'companies'].includes(module)) {
      throw new BadRequestException('module must be leads|contacts|companies');
    }

    let job = await this.prisma.bulkJob.create({
      data: {
        tenantId,
        type: BulkJobType.EXPORT,
        module,
        status: BulkJobStatus.RUNNING,
        createdById: actorUserId,
      },
    });

    try {
      const rows = await this.loadRows(tenantId, module);
      const csv = this.toCsv(rows);
      const fileKey = `${tenantId}/bulk/${job.id}.csv`;
      await this.storage.putObject(fileKey, csv, 'text/csv');

      job = await this.prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          status: BulkJobStatus.DONE,
          fileKey,
          rowCount: rows.length,
        },
      });
    } catch (err) {
      job = await this.prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          status: BulkJobStatus.FAILED,
          error: err instanceof Error ? err.message : String(err),
        },
      });
    }

    return job;
  }

  async startImport(
    tenantId: string,
    dto: CreateBulkImportDto,
    actorUserId?: string,
  ): Promise<BulkJob> {
    const module = dto.module.toLowerCase();
    if (!['leads', 'contacts'].includes(module)) {
      throw new BadRequestException('module must be leads|contacts');
    }
    if (!dto.csv?.trim()) {
      throw new BadRequestException('csv required');
    }

    let job = await this.prisma.bulkJob.create({
      data: {
        tenantId,
        type: BulkJobType.IMPORT,
        module,
        status: BulkJobStatus.RUNNING,
        createdById: actorUserId,
      },
    });

    try {
      const lines = dto.csv.trim().split(/\r?\n/);
      if (lines.length < 2) throw new BadRequestException('CSV needs header + rows');
      if (lines.length - 1 > MAX_ROWS) {
        throw new BadRequestException(`Max ${MAX_ROWS} rows`);
      }
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      let imported = 0;

      for (const line of lines.slice(1)) {
        if (!line.trim()) continue;
        const cols = line.split(',').map((c) => c.trim());
        const row: Record<string, string> = {};
        header.forEach((h, i) => {
          row[h] = cols[i] ?? '';
        });

        if (module === 'leads') {
          if (!row.title) continue;
          await this.prisma.lead.create({
            data: {
              tenantId,
              title: row.title,
              notes: row.notes || undefined,
              createdById: actorUserId,
              updatedById: actorUserId,
            },
          });
          imported += 1;
        } else {
          if (!row.name) continue;
          await this.prisma.contact.create({
            data: {
              tenantId,
              name: row.name,
              email: row.email || undefined,
              phone: row.phone || undefined,
              createdById: actorUserId,
              updatedById: actorUserId,
            },
          });
          imported += 1;
        }
      }

      const fileKey = `${tenantId}/bulk/${job.id}-import.csv`;
      await this.storage.putObject(fileKey, dto.csv, 'text/csv');

      job = await this.prisma.bulkJob.update({
        where: { id: job.id },
        data: { status: BulkJobStatus.DONE, fileKey, rowCount: imported },
      });
    } catch (err) {
      job = await this.prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          status: BulkJobStatus.FAILED,
          error: err instanceof Error ? err.message : String(err),
        },
      });
    }

    return job;
  }

  async getExportCsv(tenantId: string, id: string): Promise<string> {
    const job = await this.findOne(tenantId, id);
    if (job.type !== BulkJobType.EXPORT || !job.fileKey) {
      throw new BadRequestException('Export file not available');
    }
    if (!job.fileKey.startsWith(`${tenantId}/`)) {
      throw new BadRequestException('Invalid export file key');
    }
    return this.storage.getObjectText(job.fileKey);
  }

  private async loadRows(
    tenantId: string,
    module: string,
  ): Promise<Record<string, string | number | null>[]> {
    if (module === 'leads') {
      const rows = await this.prisma.lead.findMany({
        where: { tenantId, ...notDeleted },
        take: MAX_ROWS,
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        source: r.source,
        score: r.score,
        notes: r.notes,
      }));
    }
    if (module === 'contacts') {
      const rows = await this.prisma.contact.findMany({
        where: { tenantId, ...notDeleted },
        take: MAX_ROWS,
        orderBy: { name: 'asc' },
      });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
      }));
    }
    const rows = await this.prisma.company.findMany({
      where: { tenantId, ...notDeleted },
      take: MAX_ROWS,
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      document: r.document,
      website: r.website,
    }));
  }

  private toCsv(rows: Record<string, string | number | null>[]): string {
    if (rows.length === 0) return 'id\n';
    const keys = Object.keys(rows[0]);
    const escape = (v: string | number | null): string => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const lines = [keys.join(',')];
    for (const row of rows) {
      lines.push(keys.map((k) => escape(row[k] ?? null)).join(','));
    }
    return lines.join('\n');
  }
}

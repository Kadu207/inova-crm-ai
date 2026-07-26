/** Nested user projection for audit / owner fields on detail responses. */
export const auditUserSelect = {
  id: true,
  name: true,
  email: true,
} as const;

export const detailAuditInclude = {
  createdBy: { select: auditUserSelect },
  updatedBy: { select: auditUserSelect },
} as const;

export const detailOwnerInclude = {
  ...detailAuditInclude,
  assignedTo: { select: auditUserSelect },
} as const;

/** Skip synthetic API_TOKEN principal (not a users.id). */
export function resolveActorId(sub?: string): string | undefined {
  if (!sub || sub === 'api-token') return undefined;
  return sub;
}

export function actorCreateFields(actorUserId?: string): {
  createdById?: string;
  updatedById?: string;
} {
  if (!actorUserId) return {};
  return { createdById: actorUserId, updatedById: actorUserId };
}

export function actorUpdateFields(actorUserId?: string): { updatedById?: string } {
  if (!actorUserId) return {};
  return { updatedById: actorUserId };
}

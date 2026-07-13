import type { Prisma } from "@prisma/client";
import {
  getClientOperatingPackConfigFromBindingKey,
  normalizeOperatingPackBindingKey,
  type ClientOperatingPackBindingKey,
  type ClientOperatingPackConfig
} from "@dca-os-v1/shared";
import { createPrismaClient } from "../../../../packages/data/src/client";

export const CLIENT_OPERATING_PACK_RESOLVER_VERSION = "CLIENT_OPERATING_PACK_RESOLVER_V1";

type PrismaClientLike = ReturnType<typeof createPrismaClient>;
type PrismaTx = Prisma.TransactionClient;

const prisma = createPrismaClient();

export type ClientOperatingPackResolveReason =
  | "CLIENT_NOT_FOUND"
  | "PACK_BINDING_MISSING"
  | "PACK_KEY_UNKNOWN"
  | "TENANT_MISMATCH";

export type ResolveClientOperatingPackResult =
  | {
      ok: true;
      clientId: string;
      tenantId: string;
      operatingPackKey: ClientOperatingPackBindingKey;
      resolvedPackKey: string;
      config: ClientOperatingPackConfig;
      resolverSource: "database_binding";
    }
  | {
      ok: false;
      clientId: string | null;
      tenantId: string;
      operatingPackKey: string | null;
      resolvedPackKey: null;
      config: null;
      resolverSource: "database_binding";
      reason: ClientOperatingPackResolveReason;
    };

export type ResolveClientOperatingPackInput = {
  tenantId: string;
  clientId: string;
  /** Optional Prisma transaction — uses ambient prisma when omitted. */
  tx?: PrismaTx | PrismaClientLike;
};

/**
 * Central fail-closed resolver: Client.operatingPackKey → registry.
 * No name/domain/website/first-row fallback. No silent Puriva default.
 */
export async function resolveClientOperatingPack(
  input: ResolveClientOperatingPackInput
): Promise<ResolveClientOperatingPackResult> {
  const db = input.tx ?? prisma;
  const client = await db.client.findFirst({
    where: {
      id: input.clientId,
      tenantId: input.tenantId
    },
    select: {
      id: true,
      tenantId: true,
      operatingPackKey: true
    }
  });

  if (!client) {
    return {
      ok: false,
      clientId: input.clientId,
      tenantId: input.tenantId,
      operatingPackKey: null,
      resolvedPackKey: null,
      config: null,
      resolverSource: "database_binding",
      reason: "CLIENT_NOT_FOUND"
    };
  }

  if (client.tenantId !== input.tenantId) {
    return {
      ok: false,
      clientId: client.id,
      tenantId: input.tenantId,
      operatingPackKey: client.operatingPackKey,
      resolvedPackKey: null,
      config: null,
      resolverSource: "database_binding",
      reason: "TENANT_MISMATCH"
    };
  }

  if (client.operatingPackKey === null || client.operatingPackKey === undefined || client.operatingPackKey === "") {
    return {
      ok: false,
      clientId: client.id,
      tenantId: client.tenantId,
      operatingPackKey: null,
      resolvedPackKey: null,
      config: null,
      resolverSource: "database_binding",
      reason: "PACK_BINDING_MISSING"
    };
  }

  const bindingKey = normalizeOperatingPackBindingKey(client.operatingPackKey);
  if (!bindingKey) {
    return {
      ok: false,
      clientId: client.id,
      tenantId: client.tenantId,
      operatingPackKey: client.operatingPackKey,
      resolvedPackKey: null,
      config: null,
      resolverSource: "database_binding",
      reason: "PACK_KEY_UNKNOWN"
    };
  }

  const config = getClientOperatingPackConfigFromBindingKey(bindingKey);
  return {
    ok: true,
    clientId: client.id,
    tenantId: client.tenantId,
    operatingPackKey: bindingKey,
    resolvedPackKey: config.packKey,
    config,
    resolverSource: "database_binding"
  };
}

/** Sync lookup for already-known binding values (no I/O). */
export function lookupOperatingPackConfigFromBindingKey(
  raw: string | null | undefined
):
  | { ok: true; operatingPackKey: ClientOperatingPackBindingKey; resolvedPackKey: string; config: ClientOperatingPackConfig }
  | { ok: false; reason: "PACK_BINDING_MISSING" | "PACK_KEY_UNKNOWN" } {
  if (raw === null || raw === undefined || raw === "") {
    return { ok: false, reason: "PACK_BINDING_MISSING" };
  }
  const bindingKey = normalizeOperatingPackBindingKey(raw);
  if (!bindingKey) {
    return { ok: false, reason: "PACK_KEY_UNKNOWN" };
  }
  const config = getClientOperatingPackConfigFromBindingKey(bindingKey);
  return {
    ok: true,
    operatingPackKey: bindingKey,
    resolvedPackKey: config.packKey,
    config
  };
}

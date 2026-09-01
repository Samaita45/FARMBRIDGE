import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Tables that carry `tenantId` and must never be queried across tenants.
 *
 * Adding a tenant-scoped model without adding it here is the mistake this
 * design exists to prevent, so the list is explicit rather than inferred.
 */
const TENANT_SCOPED_MODELS = new Set<string>([
  'User',
  'FarmProfile',
  'Product',
  'Order',
  'Payment',
  'AuditLog',
]);

/** Operations that read or write rows and therefore need a tenant filter. */
const SCOPED_OPERATIONS = new Set<string>([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
]);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * A client locked to one tenant.
   *
   * Every query through it gets `tenantId` merged into its `where`, and every
   * create gets `tenantId` set. This is why isolation is a property of the data
   * layer rather than a thing each handler has to remember: a service method
   * physically cannot read another tenant's rows through this client, however
   * it is written.
   *
   * Use `this` (the unscoped client) only for genuinely cross-tenant work —
   * authentication by email before a tenant is known, platform administration,
   * and migrations. Those call sites should be few and obvious.
   */
  forTenant(tenantId: string): PrismaClient {
    if (!tenantId) {
      // Failing closed: a missing tenant must never widen a query to all rows.
      throw new InternalServerErrorException('Tenant context is required for this query');
    }

    return this.$extends({
      name: 'tenant-isolation',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!model || !TENANT_SCOPED_MODELS.has(model)) {
              return query(args);
            }

            const typedArgs = args as Record<string, unknown>;

            if (operation === 'create') {
              typedArgs.data = { ...(typedArgs.data as object), tenantId };
              return query(typedArgs);
            }

            if (operation === 'createMany' || operation === 'createManyAndReturn') {
              const data = typedArgs.data;
              typedArgs.data = Array.isArray(data)
                ? data.map((row) => ({ ...(row as object), tenantId }))
                : { ...(data as object), tenantId };
              return query(typedArgs);
            }

            if (SCOPED_OPERATIONS.has(operation)) {
              // findUnique cannot take a non-unique field in `where`, so it is
              // widened to findFirst. Slightly less efficient, and correct.
              if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
                typedArgs.where = { ...(typedArgs.where as object), tenantId };
                const fallback = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
                return (
                  query as unknown as (a: unknown, o?: string) => Promise<unknown>
                )(typedArgs, fallback);
              }

              typedArgs.where = { ...(typedArgs.where as object), tenantId };

              if (operation === 'upsert') {
                typedArgs.create = { ...(typedArgs.create as object), tenantId };
              }
            }

            return query(typedArgs);
          },
        },
      },
    }) as unknown as PrismaClient;
  }

  /** Translates Prisma's error codes into messages that do not leak schema detail. */
  static describeError(error: unknown): string {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return 'That value is already in use.';
        case 'P2025':
          return 'The record was not found.';
        case 'P2003':
          return 'That change conflicts with related data.';
        default:
          return 'The request could not be completed.';
      }
    }
    return 'The request could not be completed.';
  }
}

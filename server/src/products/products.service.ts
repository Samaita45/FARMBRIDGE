import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';

import { AUDIT_ACTIONS, AuditService, type AuditContext } from '@/audit/audit.service';
import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { assertOwnership } from '@/common/guards/ownership';
import { PERMISSIONS } from '@/rbac/permissions';
import { PrismaService } from '@/prisma/prisma.service';

import {
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

const DEFAULT_PAGE = 20;

/** What a buyer is allowed to see on the public shelf. */
const PUBLIC_STATUSES: ProductStatus[] = [ProductStatus.ACTIVE, ProductStatus.SOLD_OUT];

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateProductDto, context: AuditContext) {
    const db = this.prisma.forTenant(user.tenantId);

    const product = await db.product.create({
      data: {
        tenantId: user.tenantId,
        sellerId: user.id,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        category: dto.category.trim(),
        priceUsdCents: dto.priceUsdCents,
        unit: dto.unit?.trim() || 'kg',
        quantity: dto.quantity,
        province: dto.province?.trim() || null,
        imageUrls: dto.imageUrls ?? [],
        /*
          Publishing with nothing in stock would put a listing on the shelf that
          cannot be bought. A seller who saves zero quantity gets a draft, and
          the app tells them why.
        */
        status:
          dto.status === ProductStatus.ACTIVE && dto.quantity > 0
            ? ProductStatus.ACTIVE
            : ProductStatus.DRAFT,
      },
      // Without this the response falls back to the literal "Seller" and the
      // app shows that until something else refetches the row.
      include: { seller: { select: { id: true, name: true, province: true } } },
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.PRODUCT_CREATED,
      actor: user,
      tenantId: user.tenantId,
      resourceType: 'Product',
      resourceId: product.id,
      context,
      metadata: { category: product.category, priceUsdCents: product.priceUsdCents },
    });

    return { product: this.publicProduct(product) };
  }

  /**
   * The public shelf.
   *
   * Drafts, suspended listings and anything soft-deleted never appear here,
   * whoever is asking. A seller sees their own unpublished work through
   * `listMine` instead.
   */
  async list(user: AuthenticatedUser, query: ListProductsQueryDto) {
    const db = this.prisma.forTenant(user.tenantId);
    const take = query.limit ?? DEFAULT_PAGE;

    const where: Prisma.ProductWhereInput = {
      status: { in: PUBLIC_STATUSES },
      deletedAt: null,
      ...(query.category ? { category: query.category } : {}),
      ...(query.province ? { province: query.province } : {}),
      /*
        `mode: 'insensitive'` so a search for "tomatoes" finds "Tomatoes". Name
        and description only — searching the seller's name would let the shelf
        be used to look people up.
      */
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await db.product.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { seller: { select: { id: true, name: true, province: true } } },
    });

    // One extra row was fetched purely to answer "is there another page?".
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;

    return {
      products: page.map((row) => this.publicProduct(row)),
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  }

  /** Everything this seller has, drafts included. */
  async listMine(user: AuthenticatedUser) {
    const db = this.prisma.forTenant(user.tenantId);
    const rows = await db.product.findMany({
      where: { sellerId: user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { seller: { select: { id: true, name: true, province: true } } },
    });
    return { products: rows.map((row) => this.publicProduct(row)) };
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const db = this.prisma.forTenant(user.tenantId);
    const product = await db.product.findFirst({
      where: { id, deletedAt: null },
      include: { seller: { select: { id: true, name: true, province: true } } },
    });
    if (!product) throw new NotFoundException('Not found.');

    // An unpublished listing is visible to its seller and to a moderator, and
    // to nobody else — including by guessing its id.
    const hidden = !PUBLIC_STATUSES.includes(product.status);
    if (hidden) {
      assertOwnership(user, { ownerId: product.sellerId }, PERMISSIONS.PRODUCTS_MODERATE);
    }

    return { product: this.publicProduct(product) };
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateProductDto,
    context: AuditContext,
  ) {
    const db = this.prisma.forTenant(user.tenantId);
    const existing = await db.product.findFirst({ where: { id, deletedAt: null } });
    assertOwnership(
      user,
      existing ? { ownerId: existing.sellerId } : null,
      PERMISSIONS.PRODUCTS_MODERATE,
    );
    if (!existing) throw new NotFoundException('Not found.');

    const quantity = dto.quantity ?? existing.quantity;
    const requested = dto.status ?? existing.status;

    const product = await db.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
        ...(dto.priceUsdCents !== undefined ? { priceUsdCents: dto.priceUsdCents } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit.trim() || 'kg' } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.province !== undefined ? { province: dto.province.trim() || null } : {}),
        ...(dto.imageUrls !== undefined ? { imageUrls: dto.imageUrls } : {}),
        // Selling out is a fact about stock, not a request. Whatever the client
        // asked for, a listing with nothing left reads SOLD_OUT.
        status:
          requested === ProductStatus.ACTIVE && quantity <= 0
            ? ProductStatus.SOLD_OUT
            : requested,
      },
      include: { seller: { select: { id: true, name: true, province: true } } },
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.PRODUCT_UPDATED,
      actor: user,
      tenantId: user.tenantId,
      resourceType: 'Product',
      resourceId: product.id,
      context,
      metadata: { fields: Object.keys(dto) },
    });

    return { product: this.publicProduct(product) };
  }

  /**
   * Soft delete.
   *
   * Orders reference products, so a hard delete would take the line items of
   * past sales with it and leave a buyer's receipt pointing at nothing.
   */
  async remove(user: AuthenticatedUser, id: string, context: AuditContext) {
    const db = this.prisma.forTenant(user.tenantId);
    const existing = await db.product.findFirst({ where: { id, deletedAt: null } });
    assertOwnership(
      user,
      existing ? { ownerId: existing.sellerId } : null,
      PERMISSIONS.PRODUCTS_MODERATE,
    );
    if (!existing) throw new NotFoundException('Not found.');

    await db.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: ProductStatus.SUSPENDED },
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.PRODUCT_DELETED,
      actor: user,
      tenantId: user.tenantId,
      resourceType: 'Product',
      resourceId: id,
      context,
    });

    return { ok: true };
  }

  /**
   * The shape that leaves the server.
   *
   * The seller's name and province go out because a buyer choosing between
   * listings needs to know who and where. Their email and phone do not: buying
   * something is not a reason to be handed somebody's contact details, and the
   * order flow is where the two sides are introduced.
   */
  private publicProduct(row: {
    id: string;
    sellerId: string;
    name: string;
    description: string | null;
    category: string;
    priceUsdCents: number;
    unit: string;
    quantity: number;
    province: string | null;
    imageUrls: string[];
    status: ProductStatus;
    createdAt: Date;
    updatedAt: Date;
    seller?: { id: string; name: string; province: string | null } | null;
  }) {
    return {
      id: row.id,
      sellerId: row.sellerId,
      sellerName: row.seller?.name ?? 'Seller',
      name: row.name,
      description: row.description,
      category: row.category,
      priceUsdCents: row.priceUsdCents,
      unit: row.unit,
      quantity: row.quantity,
      province: row.province ?? row.seller?.province ?? null,
      imageUrls: row.imageUrls,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { AuditService } from '@/audit/audit.service';
import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PERMISSIONS } from '@/rbac/permissions';

import {
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /**
   * `mine` is declared before `:id` on purpose.
   *
   * Nest matches routes in declaration order, so with `:id` first the literal
   * path /products/mine would be captured as an id and every seller would get
   * a 404 for their own listings.
   */
  @Get('mine')
  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.products.listMine(user);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListProductsQueryDto) {
    return this.products.list(user, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PRODUCTS_READ)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.products.findOne(user, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRODUCTS_CREATE)
  // A listing is cheap to post and shows up in front of every buyer, so the
  // ceiling is well below what a person listing their harvest would ever need.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProductDto,
    @Req() request: Request,
  ) {
    return this.products.create(user, dto, AuditService.contextFrom(request));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() request: Request,
  ) {
    return this.products.update(user, id, dto, AuditService.contextFrom(request));
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.PRODUCTS_DELETE)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    return this.products.remove(user, id, AuditService.contextFrom(request));
  }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import type { Request } from 'express';

import { AuditService } from '@/audit/audit.service';
import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { PERMISSIONS } from '@/rbac/permissions';

import { PaymentsService } from './payments.service';

class InitiatePaymentDto {
  @IsInt() @Min(1)
  amountUsdCents!: number;

  @IsOptional() @IsString() orderId?: string;
  @IsOptional() @IsString() @MaxLength(40) method?: string;

  @IsString() @MaxLength(200)
  description!: string;

  @IsString() @MaxLength(120)
  idempotencyKey!: string;
}

@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('methods')
  methods() {
    return { methods: this.payments.supportedMethods };
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAYMENTS_CREATE)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  initiate(
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.payments.initiate(
      user,
      {
        amountUsdCents: dto.amountUsdCents,
        orderId: dto.orderId,
        description: dto.description,
        idempotencyKey: dto.idempotencyKey,
      },
      AuditService.contextFrom(request),
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PAYMENTS_READ)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.payments.listForUser(user);
  }

  /**
   * Provider callback.
   *
   * Public because the gateway has no session, but never trusted: the body is
   * authenticated by the provider adapter's signature check before anything is
   * written. An unverified callback returns 200 with accepted=false so the
   * provider stops retrying, while nothing is changed.
   */
  @Public()
  @Post('webhook/paynow')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() body: Record<string, unknown>, @Req() request: Request) {
    const accepted = await this.payments.applyWebhook(
      body,
      AuditService.contextFrom(request),
    );
    return { accepted };
  }
}

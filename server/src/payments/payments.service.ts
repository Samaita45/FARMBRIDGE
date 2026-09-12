import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AUDIT_ACTIONS, AuditService, type AuditContext } from '@/audit/audit.service';
import type { AuthenticatedUser } from '@/auth/authenticated-user';
import { PrismaService } from '@/prisma/prisma.service';

import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
  type PaymentMethod,
} from './providers/payment-provider.interface';

interface CreatePaymentInput {
  amountUsdCents: number;
  orderId?: string;
  method?: PaymentMethod;
  description: string;
  /** Caller-supplied, so a retried request cannot charge twice. */
  idempotencyKey: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  get supportedMethods(): PaymentMethod[] {
    return this.provider.supportedMethods;
  }

  async initiate(
    user: AuthenticatedUser,
    input: CreatePaymentInput,
    context: AuditContext,
  ) {
    if (input.amountUsdCents <= 0) {
      throw new BadRequestException('The amount must be greater than zero.');
    }

    // Idempotency first: a retry from a flaky mobile connection must return the
    // original payment rather than starting a second one.
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      if (existing.tenantId !== user.tenantId) throw new NotFoundException('Not found.');
      return existing;
    }

    const db = this.prisma.forTenant(user.tenantId);

    const payment = await db.payment.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        orderId: input.orderId ?? null,
        provider: this.provider.id,
        idempotencyKey: input.idempotencyKey,
        amountUsdCents: input.amountUsdCents,
        status: 'CREATED',
      },
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.PAYMENT_CREATED,
      actor: user,
      resourceType: 'Payment',
      resourceId: payment.id,
      metadata: { amountUsdCents: input.amountUsdCents, provider: this.provider.id },
      context,
    });

    try {
      const result = await this.provider.initiate({
        paymentId: payment.id,
        amountUsdCents: input.amountUsdCents,
        description: input.description,
        email: user.email,
        method: input.method,
      });

      return await db.payment.update({
        where: { id: payment.id },
        data: {
          providerRef: result.providerRef,
          status: 'PENDING',
          providerPayload: (result.raw ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Provider error';
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: reason },
      });
      await this.audit.record({
        action: AUDIT_ACTIONS.PAYMENT_FAILED,
        actor: user,
        resourceType: 'Payment',
        resourceId: payment.id,
        result: 'FAILURE',
        metadata: { reason },
        context,
      });
      throw new BadRequestException('We could not start that payment. Please try again.');
    }
  }

  /**
   * Applies a verified provider callback.
   *
   * Called only after the provider has authenticated the payload. Marking an
   * order paid on an unverified callback is how a store gives goods away.
   */
  async applyWebhook(body: Record<string, unknown>, context: AuditContext): Promise<boolean> {
    const verified = this.provider.verifyWebhook(body);
    if (!verified) {
      this.logger.warn('Rejected an unverified payment webhook');
      return false;
    }

    // Unscoped read: a webhook arrives with no session, so the tenant is
    // discovered from the payment rather than supplied by the caller.
    const payment = await this.prisma.payment.findUnique({
      where: { id: verified.paymentId },
    });
    if (!payment) {
      this.logger.warn(`Webhook referenced unknown payment ${verified.paymentId}`);
      return false;
    }

    // Terminal states are final. Providers retry callbacks, and a late "failed"
    // must not undo a completed payment.
    if (payment.status === 'PAID' || payment.status === 'REFUNDED') return true;

    const status =
      verified.status === 'paid'
        ? 'PAID'
        : verified.status === 'failed'
          ? 'FAILED'
          : verified.status === 'cancelled'
            ? 'CANCELLED'
            : 'PENDING';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        failureReason: verified.failureReason ?? null,
        paidAt: status === 'PAID' ? new Date() : null,
        providerPayload: (verified.raw ?? {}) as Prisma.InputJsonValue,
      },
    });

    if (status === 'PAID' && payment.orderId) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' },
      });
    }

    await this.audit.record({
      action: status === 'PAID' ? AUDIT_ACTIONS.PAYMENT_SUCCEEDED : AUDIT_ACTIONS.PAYMENT_FAILED,
      tenantId: payment.tenantId,
      resourceType: 'Payment',
      resourceId: payment.id,
      result: status === 'PAID' ? 'SUCCESS' : 'FAILURE',
      metadata: { status, providerRef: verified.providerRef },
      context,
    });

    return true;
  }

  async listForUser(user: AuthenticatedUser) {
    return this.prisma
      .forTenant(user.tenantId)
      .payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  }
}

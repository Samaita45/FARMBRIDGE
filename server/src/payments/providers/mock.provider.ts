import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentMethod,
  PaymentProvider,
  PaymentStatusResult,
  RefundInput,
  RefundResult,
  VerifiedWebhook,
} from './payment-provider.interface';

/**
 * Development provider.
 *
 * Exists so the checkout flow can be built and tested before Paynow
 * credentials arrive. It is selected only when PAYMENT_PROVIDER=mock, and
 * main.ts refuses to boot with it in production — a mock that marks orders paid
 * would be a way to take goods for nothing.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly id = 'mock';
  readonly displayName = 'Mock provider (development only)';
  readonly supportedMethods: PaymentMethod[] = ['ecocash', 'onemoney', 'card', 'cash'];

  private readonly logger = new Logger(MockPaymentProvider.name);
  private readonly states = new Map<string, 'pending' | 'paid'>();

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const providerRef = `mock_${randomUUID()}`;
    this.states.set(providerRef, 'pending');
    this.logger.warn(
      `Mock payment ${providerRef} for ${input.paymentId} — no money will move`,
    );
    return {
      providerRef,
      redirectUrl: null,
      instructions: 'Development provider: no payment is taken.',
      status: 'pending',
    };
  }

  async checkStatus(providerRef: string): Promise<PaymentStatusResult> {
    return { status: this.states.get(providerRef) ?? 'pending', providerRef };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    return { refunded: true, providerRef: input.providerRef };
  }

  /** Accepts any body — never enable this outside development. */
  verifyWebhook(body: Record<string, unknown>): VerifiedWebhook | null {
    const paymentId = String(body.paymentId ?? '');
    if (!paymentId) return null;
    const providerRef = String(body.providerRef ?? paymentId);
    this.states.set(providerRef, 'paid');
    return { paymentId, providerRef, status: 'paid', raw: body };
  }
}

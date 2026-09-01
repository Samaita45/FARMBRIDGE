import { createHash } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentMethod,
  PaymentProvider,
  PaymentStatusResult,
  ProviderPaymentStatus,
  RefundInput,
  RefundResult,
  VerifiedWebhook,
} from './payment-provider.interface';

/**
 * Paynow — Zimbabwe's main aggregator, covering EcoCash, OneMoney, ZIPIT,
 * local bank transfer and cards.
 *
 * Paynow authenticates both directions with a SHA-512 hash of the concatenated
 * field values plus the integration key. That key is the shared secret: it must
 * exist only in server environment variables, never in the mobile bundle, and
 * never in a log line.
 *
 * Status values are Paynow's own strings; they are mapped to our four states so
 * nothing downstream has to know the vocabulary of one gateway.
 */
@Injectable()
export class PaynowProvider implements PaymentProvider {
  readonly id = 'paynow';
  readonly displayName = 'Paynow';
  readonly supportedMethods: PaymentMethod[] = [
    'ecocash',
    'onemoney',
    'zipit',
    'bank_transfer',
    'card',
  ];

  private readonly logger = new Logger(PaynowProvider.name);
  private readonly initiateUrl = 'https://www.paynow.co.zw/interface/initiatetransaction';

  constructor(private readonly config: ConfigService) {}

  private get integrationId(): string {
    return this.config.getOrThrow<string>('PAYNOW_INTEGRATION_ID');
  }

  private get integrationKey(): string {
    return this.config.getOrThrow<string>('PAYNOW_INTEGRATION_KEY');
  }

  /**
   * Paynow's hash: concatenate the values in field order, append the
   * integration key, SHA-512, uppercase hex. The `hash` field itself is
   * excluded.
   */
  private sign(fields: Record<string, string>): string {
    const concatenated = Object.entries(fields)
      .filter(([key]) => key.toLowerCase() !== 'hash')
      .map(([, value]) => value)
      .join('');

    return createHash('sha512')
      .update(concatenated + this.integrationKey)
      .digest('hex')
      .toUpperCase();
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    // Paynow works in whole currency units; our ledger is in cents.
    const amount = (input.amountUsdCents / 100).toFixed(2);

    const fields: Record<string, string> = {
      id: this.integrationId,
      reference: input.paymentId,
      amount,
      additionalinfo: input.description,
      returnurl: this.config.getOrThrow<string>('PAYNOW_RETURN_URL'),
      resulturl: this.config.getOrThrow<string>('PAYNOW_RESULT_URL'),
      authemail: input.email,
      status: 'Message',
    };

    fields.hash = this.sign(fields);

    const response = await fetch(this.initiateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
      // Without a timeout a hung gateway holds a request thread indefinitely.
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new Error(`Paynow returned ${response.status}`);
    }

    const parsed = this.parseResponse(await response.text());

    if (parsed.status?.toLowerCase() !== 'ok') {
      throw new Error(parsed.error ?? 'Paynow rejected the transaction');
    }

    return {
      providerRef: parsed.pollurl ?? input.paymentId,
      redirectUrl: parsed.browserurl ?? null,
      status: 'pending',
      raw: parsed,
    };
  }

  async checkStatus(providerRef: string): Promise<PaymentStatusResult> {
    // providerRef is Paynow's poll URL, returned at initiation.
    const response = await fetch(providerRef, {
      method: 'POST',
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) throw new Error(`Paynow poll returned ${response.status}`);

    const parsed = this.parseResponse(await response.text());

    return {
      status: this.mapStatus(parsed.status),
      providerRef,
      failureReason: parsed.error,
      raw: parsed,
    };
  }

  /**
   * Paynow has no refund API. Refunds are performed by the merchant in the
   * Paynow dashboard, so this throws rather than silently reporting success
   * for money that was never returned.
   */
  async refund(_input: RefundInput): Promise<RefundResult> {
    throw new Error(
      'Paynow refunds are processed manually in the Paynow merchant dashboard. ' +
        'Record the refund here once it has been completed there.',
    );
  }

  verifyWebhook(body: Record<string, unknown>): VerifiedWebhook | null {
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      fields[key.toLowerCase()] = String(value ?? '');
    }

    const supplied = fields.hash;
    if (!supplied) return null;

    const expected = this.sign(fields);

    // Any mismatch means the callback was not produced by Paynow. Treating it
    // as hostile is the whole point: an unverified callback that marks an order
    // paid hands over goods for free.
    if (supplied.toUpperCase() !== expected) {
      this.logger.warn('Rejected a Paynow webhook with an invalid hash');
      return null;
    }

    const reference = fields.reference;
    if (!reference) return null;

    return {
      paymentId: reference,
      providerRef: fields.pollurl ?? reference,
      status: this.mapStatus(fields.status),
      failureReason: fields.status?.toLowerCase() === 'failed' ? fields.status : undefined,
      raw: fields,
    };
  }

  /** Paynow replies in URL-encoded key=value lines rather than JSON. */
  private parseResponse(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of text.split('&')) {
      const index = line.indexOf('=');
      if (index === -1) continue;
      const key = decodeURIComponent(line.slice(0, index)).toLowerCase().trim();
      result[key] = decodeURIComponent(line.slice(index + 1).replace(/\+/g, ' ')).trim();
    }
    return result;
  }

  private mapStatus(status: string | undefined): ProviderPaymentStatus {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'awaiting delivery':
      case 'delivered':
        return 'paid';
      case 'cancelled':
        return 'cancelled';
      case 'failed':
      case 'disputed':
        return 'failed';
      default:
        // "Sent", "Created" and anything unrecognised stay pending. Guessing
        // "paid" from an unknown status would be the expensive mistake.
        return 'pending';
    }
  }
}

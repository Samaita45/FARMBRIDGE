/**
 * The payment provider seam.
 *
 * Screens and services talk to PaymentsService; PaymentsService talks to one of
 * these. Adding EcoCash directly, ZIPIT, a card acquirer or an international
 * PSP later means writing one adapter, not touching checkout.
 *
 * Nothing in this interface leaks provider-specific concepts, and no
 * implementation of it may ever run in the mobile app: integration keys are
 * server-side only.
 */

export interface InitiatePaymentInput {
  /** Our payment id, sent to the provider so webhooks can be reconciled. */
  paymentId: string;
  amountUsdCents: number;
  /** What the payer sees on their statement or prompt. */
  description: string;
  /** Payer's email, required by most Zimbabwean gateways. */
  email: string;
  /** Mobile number for a wallet push (EcoCash, OneMoney). */
  phone?: string;
  method?: PaymentMethod;
}

export type PaymentMethod =
  | 'ecocash'
  | 'onemoney'
  | 'zipit'
  | 'bank_transfer'
  | 'card'
  | 'cash';

export interface InitiatePaymentResult {
  /** The provider's identifier for this transaction. */
  providerRef: string;
  /**
   * Where to send the payer to complete it. Null for flows that push a prompt
   * to the payer's phone instead.
   */
  redirectUrl: string | null;
  /** Provider-specific instructions to show the payer, if any. */
  instructions?: string;
  status: ProviderPaymentStatus;
  raw?: unknown;
}

export type ProviderPaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface PaymentStatusResult {
  status: ProviderPaymentStatus;
  providerRef: string;
  failureReason?: string;
  raw?: unknown;
}

export interface RefundInput {
  providerRef: string;
  amountUsdCents: number;
  reason: string;
}

export interface RefundResult {
  refunded: boolean;
  providerRef: string;
  raw?: unknown;
}

/** A webhook that has been verified as genuinely from the provider. */
export interface VerifiedWebhook {
  paymentId: string;
  providerRef: string;
  status: ProviderPaymentStatus;
  failureReason?: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly id: string;
  readonly displayName: string;
  /** Methods this provider can actually process, for the checkout screen. */
  readonly supportedMethods: PaymentMethod[];

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  checkStatus(providerRef: string): Promise<PaymentStatusResult>;
  refund(input: RefundInput): Promise<RefundResult>;

  /**
   * Verifies a webhook body and returns its meaning, or null if it did not come
   * from the provider. Returning null must be treated as hostile: an unverified
   * callback that marks an order paid is free goods.
   */
  verifyWebhook(body: Record<string, unknown>): VerifiedWebhook | null;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

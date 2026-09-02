/**
 * Support and contact channels.
 *
 * Single source of truth so the support number is not scattered across screens.
 * Override per environment with EXPO_PUBLIC_SUPPORT_PHONE — the default below is
 * a placeholder and must be replaced before release.
 */

/** E.164 without the leading '+', as wa.me requires. */
const DEFAULT_SUPPORT_PHONE = '263771234567';

export const SUPPORT_PHONE =
  process.env.EXPO_PUBLIC_SUPPORT_PHONE?.replace(/\D/g, '') || DEFAULT_SUPPORT_PHONE;

export function whatsAppUrl(message: string): string {
  return `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;
}

export const SUPPORT_WHATSAPP_URL = whatsAppUrl('Hi FarmBridge support, I need help with my account.');

/**
 * Legal documents. Empty until they are published — the settings screen shows
 * a row that says so rather than a link that goes nowhere. A store submission
 * will require at least the privacy policy.
 */
export const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL?.trim() ?? '';
export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() ?? '';

/**
 * One error type for everything the API layer can fail with.
 *
 * Screens previously caught bare `Error` and showed `e.message`, which meant a
 * dropped connection and a validation failure produced the same unhelpful
 * toast. Callers can now tell the difference and say something useful.
 */

export type ApiErrorKind =
  /** No response at all — aeroplane mode, no signal, server down. */
  | 'offline'
  /** The request took too long and was aborted. */
  | 'timeout'
  /** 400/422 — the server rejected the input. `fieldErrors` says why. */
  | 'validation'
  /** 401 — not signed in, or the session expired and could not be refreshed. */
  | 'unauthenticated'
  /** 403 — signed in, but not allowed. */
  | 'forbidden'
  /** 404 */
  | 'not_found'
  /** 409 */
  | 'conflict'
  /** 429 — rate limited. */
  | 'rate_limited'
  /** 5xx */
  | 'server'
  /** Anything unclassified, including a malformed response body. */
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Field-level messages from the server, keyed by field name. */
  readonly fieldErrors: Record<string, string>;
  /** True when retrying the same request could plausibly succeed. */
  readonly retryable: boolean;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: {
      status?: number | null;
      fieldErrors?: Record<string, string>;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status ?? null;
    this.fieldErrors = options.fieldErrors ?? {};
    this.retryable = kind === 'offline' || kind === 'timeout' || kind === 'server';
    if (options.cause !== undefined) this.cause = options.cause;
  }

  /** A message safe and useful to show a farmer, not a stack trace. */
  get userMessage(): string {
    switch (this.kind) {
      case 'offline':
        return 'No connection. Your work is saved on this device and will sync when you are back online.';
      case 'timeout':
        return 'That took too long. Check your connection and try again.';
      case 'unauthenticated':
        return 'Please sign in again.';
      case 'forbidden':
        return 'You do not have access to that.';
      case 'not_found':
        return 'We could not find that.';
      case 'rate_limited':
        return 'Too many attempts. Wait a moment and try again.';
      case 'server':
        return 'Something went wrong on our side. Please try again shortly.';
      case 'validation':
      case 'conflict':
        // The server's message is written for the user in these cases.
        return this.message;
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** True when the failure was the network rather than the request. */
export function isOfflineError(error: unknown): boolean {
  return isApiError(error) && (error.kind === 'offline' || error.kind === 'timeout');
}

function statusToKind(status: number): ApiErrorKind {
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * Builds an ApiError from a response body.
 *
 * NestJS returns `message` as either a string or an array of validation
 * strings, so both shapes are handled and array entries are mapped back to
 * field names where the format allows it.
 */
export function apiErrorFromResponse(status: number, body: unknown): ApiError {
  const kind = statusToKind(status);
  const record = (body ?? {}) as { message?: unknown; error?: unknown };

  if (Array.isArray(record.message)) {
    const fieldErrors: Record<string, string> = {};
    for (const entry of record.message) {
      if (typeof entry !== 'string') continue;
      // class-validator messages start with the property name.
      const field = entry.split(' ')[0];
      if (field && !fieldErrors[field]) fieldErrors[field] = entry;
    }
    const first = record.message.find((m) => typeof m === 'string') as string | undefined;
    return new ApiError(kind, first ?? 'Please check the details you entered.', {
      status,
      fieldErrors,
    });
  }

  const message =
    typeof record.message === 'string'
      ? record.message
      : typeof record.error === 'string'
        ? record.error
        : 'The request could not be completed.';

  return new ApiError(kind, message, { status });
}

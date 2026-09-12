import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as reachable without authentication.
 *
 * The global guard is deny-by-default, so forgetting this decorator makes an
 * endpoint private — the safe failure. Forgetting a `@UseGuards` in the
 * opposite arrangement would make it public.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

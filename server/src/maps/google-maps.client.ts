import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Outbound Google Maps HTTP client.
 *
 * The server key is read from the environment and never returned, logged, or
 * forwarded to the mobile app. Query-string keys are stripped before errors
 * are written.
 */
@Injectable()
export class GoogleMapsClient {
  private readonly logger = new Logger(GoogleMapsClient.name);
  private lastCallAt = 0;
  private readonly minIntervalMs = 80;

  constructor(private readonly config: ConfigService) {}

  get apiKey(): string {
    return (this.config.get<string>('GOOGLE_MAPS_SERVER_API_KEY') ?? '').trim();
  }

  get configured(): boolean {
    return this.apiKey.length > 0;
  }

  requireKey(): string {
    if (!this.configured) {
      throw new ServiceUnavailableException('Maps are not configured on this server.');
    }
    return this.apiKey;
  }

  async getJson<T>(url: string): Promise<T> {
    await this.throttle();
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    return this.read(response);
  }

  async postJson<T>(url: string, body: unknown, fieldMask?: string): Promise<T> {
    await this.throttle();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': this.requireKey(),
    };
    if (fieldMask) headers['X-Goog-FieldMask'] = fieldMask;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return this.read(response);
  }

  async getAuthedJson<T>(url: string, fieldMask?: string): Promise<T> {
    await this.throttle();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Goog-Api-Key': this.requireKey(),
    };
    if (fieldMask) headers['X-Goog-FieldMask'] = fieldMask;
    const response = await fetch(url, { headers });
    return this.read(response);
  }

  private async throttle(): Promise<void> {
    const wait = this.minIntervalMs - (Date.now() - this.lastCallAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    this.lastCallAt = Date.now();
  }

  private async read<T>(response: Response): Promise<T> {
    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = null;
      }
    }

    if (response.status === 429) {
      throw new HttpException('Maps request was throttled.', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (!response.ok) {
      this.logger.warn(`Google Maps HTTP ${response.status}`);
      if (response.status >= 500) {
        throw new ServiceUnavailableException('Maps service is unavailable.');
      }
      throw new HttpException('Maps request failed.', HttpStatus.BAD_GATEWAY);
    }

    if (parsed && typeof parsed === 'object' && 'status' in parsed) {
      const status = String((parsed as { status?: string }).status ?? '');
      if (status === 'OVER_QUERY_LIMIT') {
        throw new HttpException('Maps request was throttled.', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (status && status !== 'OK' && status !== 'ZERO_RESULTS') {
        this.logger.warn(`Google Maps status ${status}`);
      }
    }

    return parsed as T;
  }
}

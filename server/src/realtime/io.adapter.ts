import type { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';

/**
 * Socket.IO CORS follows the same explicit origin list as HTTP.
 * A wildcard here would undo the HTTP allowlist.
 */
export class FarmBridgeIoAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private readonly origins: string[],
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: Partial<ServerOptions>) {
    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.origins.length > 0 ? this.origins : false,
        credentials: true,
      },
    });
  }
}

import { Controller, Get } from '@nestjs/common';

import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/prisma/prisma.service';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness. Deliberately returns nothing about versions or configuration. */
  @Public()
  @Get()
  live() {
    return { status: 'ok' };
  }

  /** Readiness — checks the database is actually reachable. */
  @Public()
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      return { status: 'degraded', database: 'down' };
    }
  }
}

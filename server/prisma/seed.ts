/**
 * Development seed.
 *
 * Creates the default tenant and, outside production, one account per role so
 * permission behaviour can be exercised without hand-building fixtures.
 *
 * Refuses to run when NODE_ENV=production: seeded accounts with known
 * passwords are exactly the "demo account shipped to users" problem this
 * project already had once.
 */
import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

import { DEFAULT_PRICING_CONFIG } from '../src/transport/pricing/default-pricing';

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = '018f3a7c-4c1e-7a2b-9f4d-5e6a7b8c9d01';
const SEED_PASSWORD = 'development-only-password';

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed in production.');
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'farmbridge-zw' },
    update: {},
    create: {
      id: DEFAULT_TENANT_ID,
      name: 'FarmBridge Zimbabwe',
      slug: 'farmbridge-zw',
      countryCode: 'ZW',
    },
  });

  const passwordHash = await argon2.hash(SEED_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const accounts: { email: string; name: string; phone: string; roles: Role[] }[] = [
    { email: 'farmer@dev.local', name: 'Tendai Moyo', phone: '+263771000001', roles: [Role.FARMER] },
    { email: 'buyer@dev.local', name: 'Rudo Chikafu', phone: '+263771000002', roles: [Role.BUYER] },
    { email: 'transporter@dev.local', name: 'Blessing Ncube', phone: '+263771000003', roles: [Role.TRANSPORTER] },
    { email: 'moderator@dev.local', name: 'Chipo Dube', phone: '+263771000004', roles: [Role.MODERATOR] },
    { email: 'support@dev.local', name: 'Farai Sibanda', phone: '+263771000005', roles: [Role.SUPPORT_AGENT] },
    { email: 'auditor@dev.local', name: 'Nyasha Banda', phone: '+263771000006', roles: [Role.AUDITOR] },
    { email: 'admin@dev.local', name: 'Tapiwa Marara', phone: '+263771000007', roles: [Role.ADMIN] },
  ];

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: account.email } },
      update: { roles: account.roles },
      create: {
        tenantId: tenant.id,
        email: account.email,
        name: account.name,
        phone: account.phone,
        passwordHash,
        roles: account.roles,
        province: 'Harare',
        emailVerified: true,
      },
    });
  }

  await prisma.exchangeRate.create({
    data: { base: 'USD', quote: 'ZWG', rate: 26.5, source: 'seed', effectiveAt: new Date() },
  });

  await prisma.transportPricingConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      currency: 'USD',
      config: DEFAULT_PRICING_CONFIG,
    },
  });

  console.log(`Tenant: ${tenant.id} (${tenant.slug})`);
  console.log(`Seeded ${accounts.length} accounts, all with password: ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());

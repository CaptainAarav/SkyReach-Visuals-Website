import prisma from '../src/config/db.js';
import { hashPassword } from '../src/services/auth.service.js';

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: { name: 'Admin', email: adminEmail, passwordHash, role: 'ADMIN' },
      update: { role: 'ADMIN' },
    });
    console.log('Admin user set:', adminEmail);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

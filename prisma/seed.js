import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminEmail = 'ibejulius1@gmail.com';
//   const adminPassword = 'securepassword123';
  const adminPassword = 'Password123!';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created successfully!');
  } else {
    console.log('Admin user already exists');
  }
}

seedAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
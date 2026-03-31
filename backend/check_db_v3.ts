import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function checkDb() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const userCount = await prisma.user.count();
    const noteCount = await prisma.note.count();
    console.log(`TOTALS: USERS=${userCount}, NOTES=${noteCount}`);
    
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    for (const u of users) {
      const uNotes = await prisma.note.count({ where: { userId: u.id } });
      console.log(`USER: ${u.id} (${u.email}) has ${uNotes} notes`);
    }

  } catch (error) {
    console.log('ERROR:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkDb();

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
    const users = await prisma.user.findMany();
    console.log('--- USERS ---');
    for (const u of users) {
      console.log(`ID: ${u.id} | EMAIL: ${u.email}`);
    }
    
    const notes = await prisma.note.findMany();
    console.log('--- NOTES ---');
    for (const n of notes) {
      console.log(`ID: ${n.id} | TITLE: ${n.title} | USERID: ${n.userId}`);
    }
  } catch (error) {
    console.log('ERROR:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkDb();

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixVectorIndex() {
  try {
    console.log('Dropping old B-Tree index...');
    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS "document_chunks_embedding_idx"
    `);
    console.log('✅ Old index dropped');
    console.log('✅ Vector index fix complete - search will use sequential scan');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixVectorIndex();

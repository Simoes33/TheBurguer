import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando semente (seed) do banco de dados...');

  const categories = [
    { name: 'Burguers Artesanais' },
    { name: 'Acompanhamentos' },
    { name: 'Bebidas' },
    { name: 'Sobremesas' },
  ];



  // Versão mais segura sem campos unique:
  const count = await prisma.category.count();
  if (count === 0) {
    await prisma.category.createMany({
      data: categories
    });
    console.log('✅ Categorias criadas com sucesso!');
  } else {
    console.log('⚠️ O banco já possui categorias. Seed pulado para evitar duplicatas.');
  }

  console.log('🏁 Semente finalizada!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

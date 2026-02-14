import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('📊 Verificando habilidades por tipo de ensino...\n');

  // Contar por tipo de ensino
  const fundamental = await prisma.habilidade.count({
    where: {
      ativa: true,
      tipo_ensino: 'FUNDAMENTAL',
    },
  });

  const medio = await prisma.habilidade.count({
    where: {
      ativa: true,
      tipo_ensino: 'MEDIO',
    },
  });

  const total = await prisma.habilidade.count({
    where: { ativa: true },
  });

  console.log(`✅ Ensino Fundamental: ${fundamental} habilidades`);
  console.log(`✅ Ensino Médio: ${medio} habilidades`);
  console.log(`📊 Total ativo: ${total} habilidades`);
  console.log(`⚠️  Sem tipo_ensino definido: ${total - fundamental - medio} habilidades\n`);

  // Disciplinas do Ensino Médio
  const disciplinasMedio = await prisma.habilidade.groupBy({
    by: ['disciplina'],
    where: {
      ativa: true,
      tipo_ensino: 'MEDIO',
    },
    _count: {
      id: true,
    },
  });

  if (disciplinasMedio.length > 0) {
    console.log('📚 Disciplinas do Ensino Médio:');
    for (const disc of disciplinasMedio) {
      console.log(`  - ${disc.disciplina}: ${disc._count.id} habilidades`);
    }
  }

  await prisma.$disconnect();
}

main();

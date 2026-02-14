import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('📊 Verificando dados da BNCC no banco...\n');

  // Buscar todas as disciplinas
  const disciplinas = await prisma.disciplina.findMany({
    orderBy: { ordem: 'asc' },
    select: {
      nome: true,
      codigo: true,
    },
  });

  // Contar habilidades por disciplina
  const stats = [];
  for (const disc of disciplinas) {
    const count = await prisma.habilidade.count({
      where: {
        disciplina: disc.codigo,
        ativa: true,
      },
    });
    stats.push({
      disciplina: disc.nome,
      habilidades: count,
    });
  }

  console.table(stats);

  // Total geral
  const total = await prisma.habilidade.count({ where: { ativa: true } });
  const objetivos = await prisma.objetivoAprendizagem.count({ where: { tipo_fonte: 'BNCC' } });

  console.log(`\n✅ Total de habilidades ativas: ${total}`);
  console.log(`✅ Total de objetivos BNCC: ${objetivos}\n`);

  await prisma.$disconnect();
}

main();

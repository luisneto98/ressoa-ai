import { PrismaClient, Serie } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// Load .env
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function seedTurmas() {
  console.log('🌱 Seeding Turmas...\n');

  const demoCNPJ = '12.345.678/0001-90';

  // Buscar escola demo
  const escola = await prisma.escola.findUnique({
    where: { cnpj: demoCNPJ },
  });

  if (!escola) {
    console.log('⚠️  Escola demo não encontrada');
    console.log('   Execute primeiro: npm run prisma:seed (para criar escola e usuários)');
    return;
  }

  console.log(`✅ Escola encontrada: ${escola.nome}`);

  // Buscar professor demo
  const professor = await prisma.usuario.findFirst({
    where: {
      email: 'professor@escolademo.com',
      escola_id: escola.id,
    },
  });

  if (!professor) {
    console.log('⚠️  Professor demo não encontrado');
    return;
  }

  console.log(`✅ Professor encontrado: ${professor.nome}\n`);

  // Criar turmas: 3 disciplinas x 4 séries = 12 turmas
  const turmas = [
    // Matemática (6A, 7A, 8A, 9A)
    { nome: '6A', disciplina: 'MATEMATICA', serie: Serie.SEXTO_ANO, ano_letivo: 2026 },
    { nome: '7A', disciplina: 'MATEMATICA', serie: Serie.SETIMO_ANO, ano_letivo: 2026 },
    { nome: '8A', disciplina: 'MATEMATICA', serie: Serie.OITAVO_ANO, ano_letivo: 2026 },
    { nome: '9A', disciplina: 'MATEMATICA', serie: Serie.NONO_ANO, ano_letivo: 2026 },

    // Língua Portuguesa (6B, 7B, 8B, 9B)
    { nome: '6B', disciplina: 'LINGUA_PORTUGUESA', serie: Serie.SEXTO_ANO, ano_letivo: 2026 },
    { nome: '7B', disciplina: 'LINGUA_PORTUGUESA', serie: Serie.SETIMO_ANO, ano_letivo: 2026 },
    { nome: '8B', disciplina: 'LINGUA_PORTUGUESA', serie: Serie.OITAVO_ANO, ano_letivo: 2026 },
    { nome: '9B', disciplina: 'LINGUA_PORTUGUESA', serie: Serie.NONO_ANO, ano_letivo: 2026 },

    // Ciências (6C, 7C, 8C, 9C)
    { nome: '6C', disciplina: 'CIENCIAS', serie: Serie.SEXTO_ANO, ano_letivo: 2026 },
    { nome: '7C', disciplina: 'CIENCIAS', serie: Serie.SETIMO_ANO, ano_letivo: 2026 },
    { nome: '8C', disciplina: 'CIENCIAS', serie: Serie.OITAVO_ANO, ano_letivo: 2026 },
    { nome: '9C', disciplina: 'CIENCIAS', serie: Serie.NONO_ANO, ano_letivo: 2026 },
  ];

  let created = 0;
  let skipped = 0;

  for (const turmaData of turmas) {
    // Check if turma already exists (idempotência)
    const existingTurma = await prisma.turma.findFirst({
      where: {
        nome: turmaData.nome,
        disciplina: turmaData.disciplina,
        serie: turmaData.serie,
        ano_letivo: turmaData.ano_letivo,
        escola_id: escola.id,
      },
    });

    if (!existingTurma) {
      await prisma.turma.create({
        data: {
          ...turmaData,
          escola_id: escola.id,
          professor_id: professor.id,
        },
      });
      created++;
      const serieFormatted = turmaData.serie.replace(/_/g, ' ').replace('ANO', 'Ano');
      console.log(`  ✅ ${turmaData.nome} - ${turmaData.disciplina.replace('_', ' ')} - ${serieFormatted}`);
    } else {
      skipped++;
    }
  }

  console.log(`\n🎉 Seed completo!`);
  console.log(`   Criadas: ${created} turmas`);
  console.log(`   Já existiam: ${skipped} turmas`);
}

seedTurmas()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Erro:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

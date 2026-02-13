import { PrismaClient, Serie, RoleUsuario } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function quickSeed() {
  console.log('🚀 Quick Seed - Escola + Professor + Turmas\n');

  // 1. Criar escola demo
  const demoCNPJ = '12.345.678/0001-90';
  let escola = await prisma.escola.findUnique({
    where: { cnpj: demoCNPJ },
  });

  if (!escola) {
    escola = await prisma.escola.create({
      data: {
        nome: 'Escola Demo ABC',
        cnpj: demoCNPJ,
        email_contato: 'contato@escolademo.com',
        telefone: '(11) 98765-4321',
      },
    });
    console.log(`✅ Escola criada: ${escola.nome}`);
  } else {
    console.log(`✅ Escola já existe: ${escola.nome}`);
  }

  // 2. Criar professor demo
  let professor = await prisma.usuario.findFirst({
    where: {
      email: 'professor@escolademo.com',
      escola_id: escola.id,
    },
  });

  if (!professor) {
    const hashedPassword = await bcrypt.hash('Demo@123', 10);
    professor = await prisma.usuario.create({
      data: {
        email: 'professor@escolademo.com',
        senha_hash: hashedPassword,
        nome: 'João Professor',
        escola_id: escola.id,
        perfil_usuario: {
          create: {
            role: RoleUsuario.PROFESSOR,
          },
        },
      },
    });
    console.log(`✅ Professor criado: ${professor.nome}`);
    console.log(`   Email: professor@escolademo.com | Senha: Demo@123\n`);
  } else {
    console.log(`✅ Professor já existe: ${professor.nome}\n`);
  }

  // 3. Criar turmas
  const turmas = [
    // Matemática
    { nome: '6A', disciplina: 'MATEMATICA', serie: Serie.SEXTO_ANO, ano_letivo: 2026, turno: 'MATUTINO' },
    { nome: '7A', disciplina: 'MATEMATICA', serie: Serie.SETIMO_ANO, ano_letivo: 2026, turno: 'MATUTINO' },
    { nome: '8A', disciplina: 'MATEMATICA', serie: Serie.OITAVO_ANO, ano_letivo: 2026, turno: 'MATUTINO' },
    { nome: '9A', disciplina: 'MATEMATICA', serie: Serie.NONO_ANO, ano_letivo: 2026, turno: 'MATUTINO' },

    // Língua Portuguesa
    { nome: '6B', disciplina: 'LINGUA_PORTUGUESA', serie: Serie.SEXTO_ANO, ano_letivo: 2026, turno: 'VESPERTINO' },
    { nome: '7B', disciplina: 'LINGUA_PORTUGUESA', serie: Serie.SETIMO_ANO, ano_letivo: 2026, turno: 'VESPERTINO' },
    { nome: '8B', disciplina: 'LINGUA_PORTUGUESA', serie: Serie.OITAVO_ANO, ano_letivo: 2026, turno: 'VESPERTINO' },
    { nome: '9B', disciplina: 'LINGUA_PORTUGUESA', serie: Serie.NONO_ANO, ano_letivo: 2026, turno: 'VESPERTINO' },

    // Ciências
    { nome: '6C', disciplina: 'CIENCIAS', serie: Serie.SEXTO_ANO, ano_letivo: 2026, turno: 'INTEGRAL' },
    { nome: '7C', disciplina: 'CIENCIAS', serie: Serie.SETIMO_ANO, ano_letivo: 2026, turno: 'INTEGRAL' },
    { nome: '8C', disciplina: 'CIENCIAS', serie: Serie.OITAVO_ANO, ano_letivo: 2026, turno: 'INTEGRAL' },
    { nome: '9C', disciplina: 'CIENCIAS', serie: Serie.NONO_ANO, ano_letivo: 2026, turno: 'INTEGRAL' },
  ];

  let created = 0;
  let skipped = 0;

  for (const turmaData of turmas) {
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
      const serieStr = turmaData.serie.replace(/_/g, ' ').replace('ANO', 'Ano');
      console.log(`  ✅ ${turmaData.nome} - ${turmaData.disciplina.replace('_', ' ')} - ${serieStr}`);
    } else {
      skipped++;
    }
  }

  console.log(`\n🎉 Seed completo!`);
  console.log(`   ${created} turmas criadas`);
  console.log(`   ${skipped} turmas já existiam`);
  console.log(`\n📌 Credenciais de acesso:`);
  console.log(`   Email: professor@escolademo.com`);
  console.log(`   Senha: Demo@123`);
}

quickSeed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('\n❌ Erro:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

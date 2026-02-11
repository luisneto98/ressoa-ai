import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface HabilidadeJson {
  codigo: string;
  descricao: string;
  disciplina?: string;
  ano_inicio: number;
  ano_fim: number | null;
  unidade_tematica: string | null;
  objeto_conhecimento: string | null;
}

interface SeedFileData {
  disciplina: string;
  ano?: number;
  habilidades: HabilidadeJson[];
}

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function seedDisciplinas() {
  console.log('🌱 Seeding Disciplinas...');

  const disciplinas = [
    { codigo: 'MATEMATICA', nome: 'Matemática', area: 'Matemática', ordem: 1 },
    {
      codigo: 'LINGUA_PORTUGUESA',
      nome: 'Língua Portuguesa',
      area: 'Linguagens',
      ordem: 2,
    },
    {
      codigo: 'CIENCIAS',
      nome: 'Ciências',
      area: 'Ciências da Natureza',
      ordem: 3,
    },
  ];

  for (const disc of disciplinas) {
    await prisma.disciplina.upsert({
      where: { codigo: disc.codigo },
      update: { nome: disc.nome, area: disc.area, ordem: disc.ordem },
      create: disc,
    });
  }

  console.log(`✅ Seeded ${disciplinas.length} disciplinas`);
}

async function seedAnos() {
  console.log('🌱 Seeding Anos...');

  const anos = [
    { codigo: '6_ANO', nome: '6º Ano', ordem: 6 },
    { codigo: '7_ANO', nome: '7º Ano', ordem: 7 },
    { codigo: '8_ANO', nome: '8º Ano', ordem: 8 },
    { codigo: '9_ANO', nome: '9º Ano', ordem: 9 },
  ];

  for (const ano of anos) {
    await prisma.ano.upsert({
      where: { codigo: ano.codigo },
      update: { nome: ano.nome, ordem: ano.ordem },
      create: ano,
    });
  }

  console.log(`✅ Seeded ${anos.length} anos`);
}

async function seedHabilidades() {
  console.log('🌱 Seeding Habilidades...');

  const seedsDir = join(__dirname, 'seeds', 'bncc');
  const jsonFiles = readdirSync(seedsDir).filter((f) => f.endsWith('.json'));

  let totalHabilidades = 0;
  let totalRelacionamentos = 0;

  for (const file of jsonFiles) {
    console.log(`  📄 Processing ${file}...`);
    const content = readFileSync(join(seedsDir, file), 'utf-8');
    const data: SeedFileData = JSON.parse(content);

    for (const hab of data.habilidades) {
      const habilidade = await prisma.habilidade.upsert({
        where: { codigo: hab.codigo },
        update: {
          descricao: hab.descricao,
          disciplina: hab.disciplina || data.disciplina,
          ano_inicio: hab.ano_inicio,
          ano_fim: hab.ano_fim,
          unidade_tematica: hab.unidade_tematica,
          objeto_conhecimento: hab.objeto_conhecimento,
        },
        create: {
          codigo: hab.codigo,
          descricao: hab.descricao,
          disciplina: hab.disciplina || data.disciplina,
          ano_inicio: hab.ano_inicio,
          ano_fim: hab.ano_fim,
          unidade_tematica: hab.unidade_tematica,
          objeto_conhecimento: hab.objeto_conhecimento,
          versao_bncc: '2018',
          ativa: true,
        },
      });

      totalHabilidades++;

      // Create HabilidadeAno relationships
      const anoFim = hab.ano_fim || hab.ano_inicio;
      for (let ano = hab.ano_inicio; ano <= anoFim; ano++) {
        const anoRecord = await prisma.ano.findUnique({
          where: { codigo: `${ano}_ANO` },
        });

        if (anoRecord) {
          await prisma.habilidadeAno.upsert({
            where: {
              habilidade_id_ano_id: {
                habilidade_id: habilidade.id,
                ano_id: anoRecord.id,
              },
            },
            update: {},
            create: {
              habilidade_id: habilidade.id,
              ano_id: anoRecord.id,
            },
          });
          totalRelacionamentos++;
        }
      }
    }
  }

  console.log(`✅ Seeded ${totalHabilidades} habilidades`);
  console.log(`✅ Created ${totalRelacionamentos} HabilidadeAno relationships`);
}

async function main() {
  console.log('🚀 Starting BNCC seed...');
  console.log(`📦 Database: ${process.env['DATABASE_URL']?.split('@')[1] || 'configured'}`);

  await seedDisciplinas();
  await seedAnos();
  await seedHabilidades();

  console.log('🎉 BNCC seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

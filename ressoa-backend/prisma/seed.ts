import 'dotenv/config';
import { PrismaClient, RoleUsuario, Serie } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { mapAreaToDisciplina } from '../src/common/utils/map-area-to-disciplina';

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

interface HabilidadeEnsinoMedio {
  codigo: string;
  descricao: string;
  competencia_especifica: number;
  anos: number[];
}

interface SeedFileEnsinoMedio {
  area: string;
  tipo_ensino: string;
  habilidades: HabilidadeEnsinoMedio[];
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
    {
      codigo: 'CIENCIAS_HUMANAS',
      nome: 'Ciências Humanas',
      area: 'Ciências Humanas e Sociais Aplicadas',
      ordem: 4,
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

async function seedAdmin() {
  console.log('🌱 Seeding Admin User...');

  const adminEmail = 'admin@ressoaai.com';

  // Check if admin already exists (idempotência)
  const adminExists = await prisma.usuario.findFirst({
    where: { email: adminEmail },
  });

  if (adminExists) {
    console.log('✅ Admin já existe, pulando criação');
    return;
  }

  // Criar admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.usuario.create({
    data: {
      email: adminEmail,
      senha_hash: hashedPassword,
      nome: 'Admin Sistema',
      escola_id: null, // Admin não pertence a escola
      perfil_usuario: {
        create: {
          role: RoleUsuario.ADMIN,
        },
      },
    },
  });

  console.log(`✅ Admin criado: ${admin.email}`);
}

async function seedDemoSchool() {
  console.log('🌱 Seeding Demo School...');

  const demoCNPJ = '12.345.678/0001-90';

  // Criar ou buscar escola demo (idempotência)
  const escola = await prisma.escola.upsert({
    where: { cnpj: demoCNPJ },
    update: {},
    create: {
      nome: 'Escola Demo ABC',
      cnpj: demoCNPJ,
      email_contato: 'contato@escolademo.com',
      telefone: '(11) 98765-4321',
    },
  });

  console.log(`✅ Escola demo criada/atualizada: ${escola.nome}`);

  // Criar 3 usuários: Professor, Coordenador, Diretor
  const usuarios = [
    {
      email: 'professor@escolademo.com',
      nome: 'João Professor',
      role: RoleUsuario.PROFESSOR,
    },
    {
      email: 'coordenador@escolademo.com',
      nome: 'Maria Coordenadora',
      role: RoleUsuario.COORDENADOR,
    },
    {
      email: 'diretor@escolademo.com',
      nome: 'Ricardo Diretor',
      role: RoleUsuario.DIRETOR,
    },
  ];

  for (const userData of usuarios) {
    const hashedPassword = await bcrypt.hash('Demo@123', 10);

    const existingUser = await prisma.usuario.findFirst({
      where: {
        email: userData.email,
        escola_id: escola.id,
      },
    });

    if (!existingUser) {
      await prisma.usuario.create({
        data: {
          email: userData.email,
          senha_hash: hashedPassword,
          nome: userData.nome,
          escola_id: escola.id,
          perfil_usuario: {
            create: {
              role: userData.role,
            },
          },
        },
      });

      console.log(`✅ Usuário ${userData.role} criado: ${userData.email}`);
    } else {
      console.log(`✅ Usuário ${userData.role} já existe: ${userData.email}`);
    }
  }
}

/**
 * Seed prompts from JSON files in prisma/seeds/prompts
 * Supports versioning and idempotent upserts
 */
async function seedPrompts() {
  console.log('🧠 Seeding prompts...');

  const promptsDir = join(__dirname, 'seeds', 'prompts');
  const promptFiles = readdirSync(promptsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => join(promptsDir, f));

  if (promptFiles.length === 0) {
    console.log('⚠️  No prompt JSON files found in', promptsDir);
    return;
  }

  // Old hardcoded array replaced with auto-discovery:
  // const promptFiles = [

  for (const filePath of promptFiles) {
    const promptData = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Validate required fields (Issue #8 fix - Code Review 2026-02-12)
    if (!promptData.nome || !promptData.versao || !promptData.conteudo) {
      console.error(`⚠️  Skipping invalid prompt file: ${filePath}`);
      console.error(`    Missing required fields: nome, versao, or conteudo`);
      continue;
    }

    // Validate temperature range (Issue #5 fix - Code Review 2026-02-12)
    if (promptData.variaveis?.temperature != null) {
      const temp = promptData.variaveis.temperature;
      if (temp < 0.0 || temp > 1.0) {
        console.error(`⚠️  Skipping prompt ${promptData.nome}: invalid temperature ${temp} (must be 0.0-1.0)`);
        continue;
      }
    }

    await prisma.prompt.upsert({
      where: {
        nome_versao: {
          nome: promptData.nome,
          versao: promptData.versao,
        },
      },
      update: {
        conteudo: promptData.conteudo,
        variaveis: promptData.variaveis,
        modelo_sugerido: promptData.modelo_sugerido,
        ativo: promptData.ativo,
        ab_testing: promptData.ab_testing,
      },
      create: {
        nome: promptData.nome,
        versao: promptData.versao,
        conteudo: promptData.conteudo,
        variaveis: promptData.variaveis,
        modelo_sugerido: promptData.modelo_sugerido,
        ativo: promptData.ativo,
        ab_testing: promptData.ab_testing,
      },
    });

    console.log(`  ✓ ${promptData.nome} (${promptData.versao})`);
  }

  console.log('✅ Prompts seeded successfully');
}

async function seedTurmas() {
  console.log('🌱 Seeding Turmas...');

  const demoCNPJ = '12.345.678/0001-90';

  // Buscar escola demo
  const escola = await prisma.escola.findUnique({
    where: { cnpj: demoCNPJ },
  });

  if (!escola) {
    console.log('⚠️ Escola demo não encontrada, pulando seed de turmas');
    return;
  }

  // Buscar professor demo
  const professor = await prisma.usuario.findFirst({
    where: {
      email: 'professor@escolademo.com',
      escola_id: escola.id,
    },
  });

  if (!professor) {
    console.log('⚠️ Professor demo não encontrado, pulando seed de turmas');
    return;
  }

  // Criar turmas realistas: 3 disciplinas x 4 séries = 12 turmas
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
    } else {
      skipped++;
    }
  }

  console.log(`✅ Turmas criadas: ${created}, puladas: ${skipped}`);
}

// NOTE: mapAreaToDisciplina now imported from src/common/utils/map-area-to-disciplina.ts

/**
 * Seed BNCC Ensino Médio habilidades from JSON files
 * Story 10.3: ~53 representative habilidades across 4 areas (LGG, MAT, CNT, CHS)
 * NOTE: Full BNCC EM has ~500 habilidades - MVP uses representative sample
 */
async function seedBNCCEnsinoMedio() {
  console.log('🌱 Seeding BNCC Ensino Médio...');

  const seedsDir = join(__dirname, 'seeds', 'bncc-ensino-medio');

  let jsonFiles: string[];
  try {
    jsonFiles = readdirSync(seedsDir).filter((f) => f.endsWith('.json'));
  } catch (error) {
    console.error(`❌ Failed to read seeds directory: ${seedsDir}`, error);
    throw error;
  }

  if (jsonFiles.length === 0) {
    console.warn('⚠️  No JSON files found in bncc-ensino-medio directory');
    return;
  }

  let totalHabilidades = 0;

  for (const file of jsonFiles) {
    console.log(`  📄 Processing ${file}...`);

    try {
      const content = readFileSync(join(seedsDir, file), 'utf-8');
      const data: SeedFileEnsinoMedio = JSON.parse(content);

      // Validate JSON structure
      if (!data.area || !Array.isArray(data.habilidades)) {
        console.error(`⚠️  Skipping invalid file ${file}: missing 'area' or 'habilidades' array`);
        continue;
      }

      for (const hab of data.habilidades) {
        // Validate required fields
        if (!hab.codigo || !hab.descricao || hab.competencia_especifica == null) {
          console.error(`⚠️  Skipping invalid habilidade in ${file}: missing required fields`, hab);
          continue;
        }

        const disciplina = mapAreaToDisciplina(data.area);

        // Validate disciplina exists (prevent FK errors)
        const disciplinaExists = await prisma.disciplina.findFirst({
          where: { codigo: disciplina }
        });

        if (!disciplinaExists && disciplina !== 'OUTROS') {
          console.error(`⚠️  Disciplina '${disciplina}' not found for area '${data.area}' - skipping file ${file}`);
          console.error(`     Run seedDisciplinas() first or check mapAreaToDisciplina() mapping`);
          break; // Skip entire file if disciplina missing
        }

        await prisma.habilidade.upsert({
          where: { codigo: hab.codigo },
          update: {
            descricao: hab.descricao,
            disciplina: disciplina,
            tipo_ensino: 'MEDIO',
            ano_inicio: 1,
            ano_fim: 3,
            unidade_tematica: null,
            competencia_especifica: hab.competencia_especifica,
            metadata: { area: data.area },
          },
          create: {
            codigo: hab.codigo,
            descricao: hab.descricao,
            disciplina: disciplina,
            tipo_ensino: 'MEDIO',
            ano_inicio: 1,
            ano_fim: 3,
            unidade_tematica: null,
            competencia_especifica: hab.competencia_especifica,
            objeto_conhecimento: null,
            metadata: { area: data.area },
            versao_bncc: '2018',
            ativa: true,
          },
        });

        totalHabilidades++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${file}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Seed failed at file ${file}: ${errorMessage}`);
    }
  }

  console.log(`✅ Seeded ${totalHabilidades} habilidades de Ensino Médio`);
}

async function main() {
  console.log('🚀 Starting seed...');
  console.log(`📦 Database: ${process.env['DATABASE_URL']?.split('@')[1] || 'configured'}`);

  // Seed BNCC (Epic 0)
  await seedDisciplinas();
  await seedAnos();
  await seedHabilidades();

  // Seed BNCC Ensino Médio (Story 10.3)
  await seedBNCCEnsinoMedio();

  // Seed Prompts (Story 5.3)
  await seedPrompts();

  // Seed Admin & Demo School (Story 1.6)
  await seedAdmin();
  await seedDemoSchool();

  // Seed Turmas (Story 2.3 - blocker resolution)
  await seedTurmas();

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

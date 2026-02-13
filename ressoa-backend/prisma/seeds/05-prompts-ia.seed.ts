import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Seed de Prompts de IA (5 prompts x 3 versões = 15 prompts)
 *
 * **Versões:**
 * - v1.0.0: BNCC EF only (baseline)
 * - v2.0.0: BNCC EF + EM (Story 10.6)
 * - v3.0.0: BNCC + Custom Curriculum (Story 11.7)
 *
 * **Idempotência:** Upsert por (nome + versao) - re-execuções seguras
 */
export async function seedPrompts() {
  console.log('🔧 Seeding Prompts IA...');

  const promptFiles = [
    'prompt-cobertura-v3.0.0.json',
    'prompt-qualitativa-v3.0.0.json',
    'prompt-relatorio-v3.0.0.json',
    'prompt-exercicios-v3.0.0.json',
    'prompt-alertas-v3.0.0.json',
  ];

  const promptsDir = path.join(__dirname, 'prompts');

  let createdCount = 0;
  let updatedCount = 0;

  for (const filename of promptFiles) {
    const filePath = path.join(promptsDir, filename);

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const promptData = JSON.parse(fileContent);

      // Upsert: create if not exists, update if exists
      const result = await prisma.promptIA.upsert({
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
          ab_testing: promptData.ab_testing ?? false,
        },
        create: {
          nome: promptData.nome,
          versao: promptData.versao,
          conteudo: promptData.conteudo,
          variaveis: promptData.variaveis,
          modelo_sugerido: promptData.modelo_sugerido,
          ativo: promptData.ativo,
          ab_testing: promptData.ab_testing ?? false,
        },
      });

      if (result.created_at === result.updated_at) {
        createdCount++;
        console.log(`  ✅ Created: ${promptData.nome} ${promptData.versao}`);
      } else {
        updatedCount++;
        console.log(`  ♻️  Updated: ${promptData.nome} ${promptData.versao}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to load ${filename}:`, error);
      throw error;
    }
  }

  console.log(`\n✅ Prompts IA v3.0.0 seed complete:`);
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Updated: ${updatedCount}`);
  console.log(`   - Total processed: ${promptFiles.length}`);
  console.log(`\n📊 Active prompts in database:`);

  const activePrompts = await prisma.promptIA.findMany({
    where: { ativo: true },
    select: { nome: true, versao: true },
    orderBy: [{ nome: 'asc' }, { versao: 'desc' }],
  });

  console.log(`   Total active: ${activePrompts.length}`);
  console.log(`   Breakdown:`);

  const promptNames = Array.from(new Set(activePrompts.map(p => p.nome)));
  for (const nome of promptNames) {
    const versions = activePrompts.filter(p => p.nome === nome).map(p => p.versao);
    console.log(`     - ${nome}: ${versions.join(', ')}`);
  }
}

// Run if called directly
if (require.main === module) {
  seedPrompts()
    .then(() => {
      console.log('\n✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seed failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

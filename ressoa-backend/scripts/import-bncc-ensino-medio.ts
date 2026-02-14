/**
 * Script para importar todas as habilidades da BNCC Ensino Médio (1º-3º ano)
 * da API https://cientificar1992.pythonanywhere.com/bncc_medio/
 *
 * Gera arquivos JSON no formato esperado pelo seed do projeto
 *
 * Uso: npm run import-bncc-medio
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

const API_URL = 'https://cientificar1992.pythonanywhere.com/bncc_medio/';

/**
 * Mapeamento das áreas do Ensino Médio para disciplinas do projeto
 */
const AREA_MAP: Record<string, { codigo: string; nome: string }> = {
  'linguagens': { codigo: 'LINGUA_PORTUGUESA', nome: 'Linguagens' },
  'matematica_medio': { codigo: 'MATEMATICA', nome: 'Matemática' },
  'ciencias_natureza': { codigo: 'CIENCIAS', nome: 'Ciências da Natureza' },
  'ciencias_humanas': { codigo: 'CIENCIAS_HUMANAS', nome: 'Ciências Humanas' },
  'lingua_portuguesa_medio': { codigo: 'LINGUA_PORTUGUESA', nome: 'Língua Portuguesa' },
  'computacao_medio': { codigo: 'COMPUTACAO', nome: 'Computação' },
};

interface HabilidadeSeedEM {
  codigo: string;
  descricao: string;
  competencia_especifica: number;
  anos: number[];
}

interface SeedFileEnsinoMedio {
  area: string;
  tipo_ensino: string;
  habilidades: HabilidadeSeedEM[];
}

/**
 * Extrai número da competência específica do código
 * Ex: "EM13LGG101" -> 1 (primeiro dígito após a área)
 */
function extractCompetenciaEspecifica(codigo: string): number {
  // Formato: EM13LGG101
  // EM = Ensino Médio
  // 13 = ano/série
  // LGG = área
  // 1 = competência específica
  // 01 = número sequencial
  const match = codigo.match(/[A-Z]+(\d)/);
  return match ? parseInt(match[1], 10) : 1;
}

async function fetchBNCCEnsinoMedioCompleta(): Promise<any> {
  console.log(`🔍 Buscando dados completos da BNCC Ensino Médio...`);

  try {
    const response = await axios.get(API_URL, {
      timeout: 60000,
      headers: {
        'User-Agent': 'RessoaAI-BNCC-Importer/1.0',
      },
    });

    console.log(`✅ Dados carregados com sucesso\n`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Erro ao buscar BNCC Médio: ${error.response?.status} - ${error.message}`);
    }
    throw error;
  }
}

async function importarTodasDisciplinasEM() {
  console.log('🚀 Iniciando importação da BNCC Ensino Médio (1º-3º ano)...\n');

  const outputDir = join(__dirname, '..', 'prisma', 'seeds', 'bncc-ensino-medio');

  // Criar diretório se não existir
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Buscar JSON completo da API
  const bnccData = await fetchBNCCEnsinoMedioCompleta();

  let totalHabilidades = 0;
  let totalArquivos = 0;

  // Iterar por áreas
  for (const [areaSlug, areaInfo] of Object.entries(AREA_MAP)) {
    console.log(`\n📚 ${areaInfo.nome}`);

    const areaData = bnccData[areaSlug];

    if (!areaData || !areaData.ano || !Array.isArray(areaData.ano)) {
      console.log(`    ⚠️  Área não encontrada na API ou formato inválido`);
      continue;
    }

    const habilidades: HabilidadeSeedEM[] = [];

    // Iterar pelos anos (geralmente 1 único objeto com todos os anos 1º-3º)
    for (const anoData of areaData.ano) {
      if (!anoData.codigo_habilidade || !Array.isArray(anoData.codigo_habilidade)) {
        continue;
      }

      // Iterar pelas habilidades
      for (const hab of anoData.codigo_habilidade) {
        const codigo = hab.nome_codigo;
        const descricao = hab.nome_habilidade;

        if (!codigo || !descricao) {
          console.warn(`    ⚠️  Habilidade inválida:`, hab);
          continue;
        }

        const competenciaNum = extractCompetenciaEspecifica(codigo);

        habilidades.push({
          codigo: codigo,
          descricao: descricao,
          competencia_especifica: competenciaNum,
          anos: [1, 2, 3], // Todas as habilidades EM cobrem 1º-3º ano
        });
      }
    }

    if (habilidades.length === 0) {
      console.log(`    ⏭️  Sem habilidades encontradas`);
      continue;
    }

    // Remover duplicatas (mesmo código)
    const habilidadesUnicas = Array.from(
      new Map(habilidades.map(h => [h.codigo, h])).values()
    );

    const seedData: SeedFileEnsinoMedio = {
      area: areaInfo.codigo,
      tipo_ensino: 'MEDIO',
      habilidades: habilidadesUnicas,
    };

    const fileName = `bncc-em-${areaSlug}.json`;
    const filePath = join(outputDir, fileName);

    writeFileSync(filePath, JSON.stringify(seedData, null, 2), 'utf-8');

    console.log(`    ✅ ${habilidadesUnicas.length} habilidades → ${fileName}`);

    totalHabilidades += habilidadesUnicas.length;
    totalArquivos++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 Importação concluída!`);
  console.log(`📊 ${totalArquivos} arquivos criados`);
  console.log(`📝 ${totalHabilidades} habilidades importadas`);
  console.log(`📁 Arquivos salvos em: ${outputDir}`);
  console.log('='.repeat(60));
}

// Executar importação
importarTodasDisciplinasEM()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

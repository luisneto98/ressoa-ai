/**
 * Script para importar todas as habilidades da BNCC Ensino Fundamental (6º-9º ano)
 * da API https://cientificar1992.pythonanywhere.com/bncc_fundamental/
 *
 * Gera arquivos JSON no formato esperado pelo seed do projeto
 *
 * Uso: npm run import-bncc
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

const API_URL = 'https://cientificar1992.pythonanywhere.com/bncc_fundamental/';

/**
 * Mapeamento das disciplinas da API para os códigos do projeto
 */
const DISCIPLINA_MAP: Record<string, { codigo: string; nome: string; area: string }> = {
  'lingua_portuguesa': { codigo: 'LINGUA_PORTUGUESA', nome: 'Língua Portuguesa', area: 'Linguagens' },
  'matematica': { codigo: 'MATEMATICA', nome: 'Matemática', area: 'Matemática' },
  'ciencias': { codigo: 'CIENCIAS', nome: 'Ciências', area: 'Ciências da Natureza' },
  'historia': { codigo: 'HISTORIA', nome: 'História', area: 'Ciências Humanas e Sociais Aplicadas' },
  'geografia': { codigo: 'GEOGRAFIA', nome: 'Geografia', area: 'Ciências Humanas e Sociais Aplicadas' },
  'arte': { codigo: 'ARTE', nome: 'Arte', area: 'Linguagens' },
  'educacao_fisica': { codigo: 'EDUCACAO_FISICA', nome: 'Educação Física', area: 'Linguagens' },
  'lingua_inglesa': { codigo: 'LINGUA_INGLESA', nome: 'Língua Inglesa', area: 'Linguagens' },
  'ensino_religioso': { codigo: 'ENSINO_RELIGIOSO', nome: 'Ensino Religioso', area: 'Ensino Religioso' },
  'computacao': { codigo: 'COMPUTACAO', nome: 'Computação', area: 'Matemática' },
};

/**
 * Anos alvos (6º-9º)
 */
const ANOS_ALVOS = ['6º', '7º', '8º', '9º'];

interface HabilidadeSeed {
  codigo: string;
  descricao: string;
  ano_inicio: number;
  ano_fim: number | null;
  unidade_tematica: string | null;
  objeto_conhecimento: string | null;
}

interface SeedFileData {
  disciplina: string;
  ano: number;
  habilidades: HabilidadeSeed[];
}

/**
 * Extrai código da habilidade do texto (ex: "(EF06MA01) ..." -> "EF06MA01")
 */
function extractCodigoHabilidade(nomeHabilidade: string): string | null {
  const match = nomeHabilidade.match(/\(([A-Z0-9]+)\)/);
  return match ? match[1] : null;
}

/**
 * Remove código do início da descrição
 */
function cleanDescricao(nomeHabilidade: string): string {
  return nomeHabilidade.replace(/^\([A-Z0-9]+\)\s*/, '').trim();
}

/**
 * Converte "6º" para número 6
 */
function anoToNumber(anoStr: string): number | null {
  const match = anoStr.match(/(\d+)º/);
  return match ? parseInt(match[1], 10) : null;
}

async function fetchBNCCCompleta(): Promise<any> {
  console.log(`🔍 Buscando dados completos da BNCC...`);

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
      throw new Error(`Erro ao buscar BNCC: ${error.response?.status} - ${error.message}`);
    }
    throw error;
  }
}

async function importarTodasDisciplinas() {
  console.log('🚀 Iniciando importação da BNCC Ensino Fundamental (6º-9º ano)...\n');

  const outputDir = join(__dirname, '..', 'prisma', 'seeds', 'bncc');

  // Criar diretório se não existir
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Buscar JSON completo da API
  const bnccData = await fetchBNCCCompleta();

  let totalHabilidades = 0;
  let totalArquivos = 0;

  // Iterar por disciplinas
  for (const [disciplinaSlug, disciplinaInfo] of Object.entries(DISCIPLINA_MAP)) {
    console.log(`\n📚 ${disciplinaInfo.nome}`);

    const disciplinaData = bnccData[disciplinaSlug];

    if (!disciplinaData || !disciplinaData.ano || !Array.isArray(disciplinaData.ano)) {
      console.log(`    ⚠️  Disciplina não encontrada na API ou formato inválido`);
      continue;
    }

    // Iterar por anos (buscar apenas 6º-9º)
    for (const anoData of disciplinaData.ano) {
      if (!anoData.nome_ano || !Array.isArray(anoData.nome_ano) || anoData.nome_ano.length === 0) {
        continue;
      }

      const anoStr = anoData.nome_ano[0]; // Ex: "6º"
      const anoNum = anoToNumber(anoStr);

      // Filtrar apenas 6º-9º ano
      if (!anoNum || anoNum < 6 || anoNum > 9) {
        continue;
      }

      const habilidades: HabilidadeSeed[] = [];

      // Iterar por unidades temáticas
      if (anoData.unidades_tematicas && Array.isArray(anoData.unidades_tematicas)) {
        for (const unidade of anoData.unidades_tematicas) {
          const nomeUnidade = unidade.nome_unidade || null;

          // Iterar por objetos de conhecimento
          if (unidade.objeto_conhecimento && Array.isArray(unidade.objeto_conhecimento)) {
            for (const objeto of unidade.objeto_conhecimento) {
              const nomeObjeto = objeto.nome_objeto || null;

              // Iterar por habilidades
              if (objeto.habilidades && Array.isArray(objeto.habilidades)) {
                for (const hab of objeto.habilidades) {
                  const nomeHabilidade = hab.nome_habilidade;
                  const codigo = extractCodigoHabilidade(nomeHabilidade);

                  if (!codigo) {
                    console.warn(`    ⚠️  Habilidade sem código: ${nomeHabilidade.substring(0, 50)}...`);
                    continue;
                  }

                  habilidades.push({
                    codigo: codigo,
                    descricao: cleanDescricao(nomeHabilidade),
                    ano_inicio: anoNum,
                    ano_fim: null,
                    unidade_tematica: nomeUnidade,
                    objeto_conhecimento: nomeObjeto,
                  });
                }
              }
            }
          }
        }
      }

      if (habilidades.length === 0) {
        console.log(`    ⏭️  Sem habilidades para ${anoStr} ano`);
        continue;
      }

      const seedData: SeedFileData = {
        disciplina: disciplinaInfo.codigo,
        ano: anoNum,
        habilidades: habilidades,
      };

      const fileName = `${disciplinaSlug}-${anoNum}ano.json`;
      const filePath = join(outputDir, fileName);

      writeFileSync(filePath, JSON.stringify(seedData, null, 2), 'utf-8');

      console.log(`    ✅ ${anoStr} ano: ${habilidades.length} habilidades → ${fileName}`);

      totalHabilidades += habilidades.length;
      totalArquivos++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 Importação concluída!`);
  console.log(`📊 ${totalArquivos} arquivos criados`);
  console.log(`📝 ${totalHabilidades} habilidades importadas`);
  console.log(`📁 Arquivos salvos em: ${outputDir}`);
  console.log('='.repeat(60));
}

// Executar importação
importarTodasDisciplinas()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

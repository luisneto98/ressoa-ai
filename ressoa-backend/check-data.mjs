import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const escolaId = '7748d7b7-a8b8-4a7f-85fd-5664926f07db';
  const professorId = 'fcc79e6c-5e42-4fcd-a667-485c98ae2562';
  
  console.log('=== Turmas do professor ===');
  const turmas = await prisma.turma.findMany({
    where: { professor_id: professorId, escola_id: escolaId, deleted_at: null },
    select: { id: true, nome: true, disciplina: true, serie: true }
  });
  console.log(JSON.stringify(turmas, null, 2));
  
  console.log('\n=== Planejamentos do professor ===');
  const planejamentos = await prisma.planejamento.findMany({
    where: { professor_id: professorId, escola_id: escolaId, deleted_at: null },
    include: { 
      turma: { select: { nome: true, disciplina: true } },
      habilidades: { select: { habilidade_id: true } }
    }
  });
  console.log(JSON.stringify(planejamentos.map(p => ({
    turma: p.turma.nome,
    disciplina: p.turma.disciplina,
    bimestre: p.bimestre,
    ano_letivo: p.ano_letivo,
    num_habilidades: p.habilidades.length
  })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

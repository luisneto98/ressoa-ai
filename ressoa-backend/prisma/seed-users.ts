import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function seedUsers() {
  console.log('🌱 Seeding test users...');

  // Hash password (same for all test users)
  const hashedPassword = await bcrypt.hash('SenhaSegura123!', 10);

  // Escola 1 - ABC
  const escola1 = await prisma.escola.upsert({
    where: { cnpj: '12345678000190' },
    update: {},
    create: {
      nome: 'Escola ABC',
      cnpj: '12345678000190',
    },
  });

  console.log(`✅ Created/Updated Escola: ${escola1.nome}`);

  // Escola 2 - XYZ
  const escola2 = await prisma.escola.upsert({
    where: { cnpj: '98765432000100' },
    update: {},
    create: {
      nome: 'Escola XYZ',
      cnpj: '98765432000100',
    },
  });

  console.log(`✅ Created/Updated Escola: ${escola2.nome}`);

  // Professor - Escola ABC
  const professor = await prisma.usuario.upsert({
    where: {
      email_escola_id: {
        email: 'professor@escola.com',
        escola_id: escola1.id,
      },
    },
    update: {
      senha_hash: hashedPassword,
    },
    create: {
      nome: 'João Silva',
      email: 'professor@escola.com',
      senha_hash: hashedPassword,
      escola_id: escola1.id,
    },
  });

  await prisma.perfilUsuario.upsert({
    where: { usuario_id: professor.id },
    update: { role: 'PROFESSOR' },
    create: {
      usuario_id: professor.id,
      role: 'PROFESSOR',
    },
  });

  console.log(`✅ Created/Updated User: ${professor.email} (PROFESSOR)`);

  // Coordenador - Escola ABC
  const coordenador = await prisma.usuario.upsert({
    where: {
      email_escola_id: {
        email: 'coordenador@escola.com',
        escola_id: escola1.id,
      },
    },
    update: {
      senha_hash: hashedPassword,
    },
    create: {
      nome: 'Maria Santos',
      email: 'coordenador@escola.com',
      senha_hash: hashedPassword,
      escola_id: escola1.id,
    },
  });

  await prisma.perfilUsuario.upsert({
    where: { usuario_id: coordenador.id },
    update: { role: 'COORDENADOR' },
    create: {
      usuario_id: coordenador.id,
      role: 'COORDENADOR',
    },
  });

  console.log(
    `✅ Created/Updated User: ${coordenador.email} (COORDENADOR)`,
  );

  // Diretor - Escola XYZ
  const diretor = await prisma.usuario.upsert({
    where: {
      email_escola_id: {
        email: 'diretor@escola.com',
        escola_id: escola2.id,
      },
    },
    update: {
      senha_hash: hashedPassword,
    },
    create: {
      nome: 'Carlos Oliveira',
      email: 'diretor@escola.com',
      senha_hash: hashedPassword,
      escola_id: escola2.id,
    },
  });

  await prisma.perfilUsuario.upsert({
    where: { usuario_id: diretor.id },
    update: { role: 'DIRETOR' },
    create: {
      usuario_id: diretor.id,
      role: 'DIRETOR',
    },
  });

  console.log(`✅ Created/Updated User: ${diretor.email} (DIRETOR)`);

  console.log('\n🎉 Test users seeded successfully!');
  console.log('\n📧 Test credentials:');
  console.log(
    '   - professor@escola.com : SenhaSegura123! (Escola ABC, Professor)',
  );
  console.log(
    '   - coordenador@escola.com : SenhaSegura123! (Escola ABC, Coordenador)',
  );
  console.log(
    '   - diretor@escola.com : SenhaSegura123! (Escola XYZ, Diretor)',
  );
  console.log('\n💡 Password for all users: SenhaSegura123!\n');
}

seedUsers()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

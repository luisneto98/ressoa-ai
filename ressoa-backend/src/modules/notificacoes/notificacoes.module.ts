import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificacoesService } from './notificacoes.service';
import { NotificacoesController } from './notificacoes.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../common/email/email.module';

/**
 * NotificacoesModule
 * Story 4.4 - AC2: NotificacoesModule
 *
 * Exports NotificacoesService for use in other modules (e.g., STT worker)
 */
@Module({
  imports: [ConfigModule, PrismaModule, EmailModule],
  controllers: [NotificacoesController],
  providers: [NotificacoesService],
  exports: [NotificacoesService], // ✅ Export for use in transcription worker
})
export class NotificacoesModule {}

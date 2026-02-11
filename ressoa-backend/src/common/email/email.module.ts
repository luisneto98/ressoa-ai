import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';

/**
 * EmailModule - Global email service for password recovery
 * Story 1.5 - Task 1: Create EmailService
 *
 * @Global decorator makes EmailService available across all modules
 * without explicit imports
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

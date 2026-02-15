import { Global, Module } from '@nestjs/common';
import { ProvidersConfigService } from './providers-config.service';

@Global()
@Module({
  providers: [ProvidersConfigService],
  exports: [ProvidersConfigService],
})
export class ProvidersConfigModule {}

import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanejamentoDto } from './create-planejamento.dto';

export class UpdatePlanejamentoDto extends PartialType(CreatePlanejamentoDto) {}

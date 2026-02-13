import { PartialType } from '@nestjs/swagger';
import { CreateTurmaDto } from './create-turma.dto';

export class UpdateTurmaDto extends PartialType(CreateTurmaDto) {
  // Todos os campos do CreateTurmaDto são opcionais aqui
  // tipo_ensino incluído automaticamente
}

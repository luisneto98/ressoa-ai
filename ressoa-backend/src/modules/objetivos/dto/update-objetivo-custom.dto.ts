import { PartialType } from '@nestjs/swagger';
import { CreateObjetivoCustomDto } from './create-objetivo-custom.dto';

/**
 * DTO para atualização parcial de objetivo customizado
 * Story 11.4: Backend — CRUD de Objetivos Customizados
 *
 * Usado no endpoint PATCH /turmas/:turma_id/objetivos/:id
 * Todos os campos são opcionais (patch parcial)
 * Validações do CreateObjetivoCustomDto são aplicadas quando campos estão presentes
 */
export class UpdateObjetivoCustomDto extends PartialType(
  CreateObjetivoCustomDto,
) {}

import { IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TimelineQueryDto {
  @IsUUID()
  turma_id!: string;

  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  bimestre!: number;
}

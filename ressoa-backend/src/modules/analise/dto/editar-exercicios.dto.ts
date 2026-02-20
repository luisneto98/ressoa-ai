import {
  IsObject,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AlternativaDto {
  @IsString()
  @IsNotEmpty()
  letra!: string; // A, B, C, ou D

  @IsString()
  @IsNotEmpty()
  texto!: string;

  @IsBoolean()
  correta!: boolean;
}

export class QuestaoDto {
  @IsNumber()
  numero!: number;

  @IsString()
  @IsNotEmpty()
  enunciado!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlternativaDto)
  alternativas!: AlternativaDto[];

  @IsString()
  @IsNotEmpty()
  habilidade_bncc!: string;

  @IsString()
  @IsNotEmpty()
  nivel_bloom!: string;

  @IsString()
  @IsNotEmpty()
  explicacao!: string;
}

export class ExerciciosPayloadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestaoDto)
  questoes!: QuestaoDto[];
}

export class EditarExerciciosDto {
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ExerciciosPayloadDto)
  exercicios!: ExerciciosPayloadDto;
}

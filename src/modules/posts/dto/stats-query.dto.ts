import { IsOptional, IsString } from 'class-validator';

export class StatsQueryDto {
  @IsOptional()
  @IsString({ message: 'La fecha inicial debe ser una cadena de texto' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'La fecha final debe ser una cadena de texto' })
  endDate?: string;
}

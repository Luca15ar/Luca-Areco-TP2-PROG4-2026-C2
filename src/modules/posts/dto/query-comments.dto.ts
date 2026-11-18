import { IsOptional, IsNumberString } from 'class-validator';

export class QueryCommentsDto {
  @IsOptional()
  @IsNumberString({}, { message: 'El límite debe ser un número' })
  limit?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'El desplazamiento debe ser un número' })
  offset?: string;
}

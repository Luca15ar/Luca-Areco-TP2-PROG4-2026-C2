import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPostsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite mínimo es 1' })
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El desplazamiento debe ser un número' })
  @Min(0, { message: 'El desplazamiento no puede ser negativo' })
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number;

  @IsOptional()
  @IsString()
  @IsIn(['date', 'recent', 'likes'], {
    message: 'El ordenamiento debe ser por fecha (date/recent) o por me gusta (likes)',
  })
  sort?: 'date' | 'recent' | 'likes' = 'date';

  @IsOptional()
  @IsString()
  authorId?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StatusEmbarque } from '../../../generated/prisma/enums';

export class QueryEmbarqueDto extends PaginationDto {
  @ApiPropertyOptional({ enum: StatusEmbarque })
  @IsOptional()
  @IsEnum(StatusEmbarque)
  status?: StatusEmbarque;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vooId?: number;
}
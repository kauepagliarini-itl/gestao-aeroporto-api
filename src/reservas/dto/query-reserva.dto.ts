import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StatusReserva } from '../../../generated/prisma/enums';

export class QueryReservaDto extends PaginationDto {
  @ApiPropertyOptional({ enum: StatusReserva })
  @IsOptional()
  @IsEnum(StatusReserva)
  status?: StatusReserva;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vooId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;
}
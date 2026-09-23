import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StatusVoo } from '../../../generated/prisma/enums';

export class QueryVooDto extends PaginationDto {
  @ApiPropertyOptional({ enum: StatusVoo })
  @IsOptional()
  @IsEnum(StatusVoo)
  status?: StatusVoo;

  @ApiPropertyOptional({ example: 'GRU' })
  @IsOptional()
  @IsString()
  origem?: string;

  @ApiPropertyOptional({ example: 'GIG' })
  @IsOptional()
  @IsString()
  destino?: string;
}
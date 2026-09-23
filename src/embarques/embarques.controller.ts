import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { EmbarquesService } from './embarques.service';
import { CreateEmbarqueDto } from './dto/create-embarque.dto';
import { QueryEmbarqueDto } from './dto/query-embarque.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /embarques
@ApiTags('Embarques')
@ApiBearerAuth('Bearer Token')
@Controller('embarques')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OPERATOR, Role.ADMIN)
export class EmbarquesController {
  constructor(private readonly embarquesService: EmbarquesService) {}

  @Post()
  @ApiOperation({ summary: 'Registra um embarque' })
  @ApiBody({ type: CreateEmbarqueDto })
  @ApiResponse({ status: 201, description: 'Embarque registrado' })
  @ApiResponse({ status: 400, description: 'Reserva/voo em estado inválido' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada' })
  @ApiResponse({ status: 409, description: 'Voo cancelado ou embarque duplicado' })
  criar(@Body() dto: CreateEmbarqueDto) {
    return this.embarquesService.criar(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista embarques com paginação e filtros' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  listarTodos(@Query() query: QueryEmbarqueDto) {
    return this.embarquesService.listarTodos(query);
  }

  @Get('voo/:vooId')
  @ApiOperation({ summary: 'Lista embarques de um voo' })
  @ApiParam({ name: 'vooId', example: 1 })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  listarPorVoo(@Param('vooId', ParseIntPipe) vooId: number) {
    return this.embarquesService.listarPorVoo(vooId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca embarque por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Embarque encontrado' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.embarquesService.buscarPorId(id);
  }
}
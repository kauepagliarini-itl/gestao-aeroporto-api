// ═══════════════════════════════════════════════════════════════════
// VoosController — Camada HTTP de Voos
// ═══════════════════════════════════════════════════════════════════
//
// Rotas:
//   POST   /voos                → criar (OPERATOR ou ADMIN)
//   GET    /voos                → listar (qualquer autenticado)
//   GET    /voos/:id            → buscar por id (qualquer autenticado)
//   GET    /voos/:id/clima      → consulta clima do destino (qualquer autenticado)
//   PATCH  /voos/:id            → editar (OPERATOR ou ADMIN)
//   PATCH  /voos/:id/status     → mudar status (OPERATOR ou ADMIN)
//
// ⚠️ ORDEM DAS ROTAS importa no NestJS:
//    ":id/status" e ":id/clima" precisam vir ANTES de ":id", senão o
//    NestJS interpretaria "status"/"clima" como um ID.

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { VoosService } from './voos.service';
import { CreateVooDto } from './dto/create-voo.dto';
import { UpdateVooDto } from './dto/update-voo.dto';
import { UpdateStatusVooDto } from './dto/update-status-voo.dto';
import { QueryVooDto } from './dto/query-voo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /voos
@ApiTags('Voos')
@ApiBearerAuth('Bearer Token')
@Controller('voos')
@UseGuards(JwtAuthGuard)
export class VoosController {
  constructor(private readonly voosService: VoosService) {}

  // ═══════════════════════════════════════════════════════════════
  // POST /voos — CRIAR
  // ═══════════════════════════════════════════════════════════════
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Cria um novo voo' })
  @ApiBody({ type: CreateVooDto })
  @ApiResponse({ status: 201, description: 'Voo criado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Conflito de portão' })
  criar(@Body() dto: CreateVooDto) {
    return this.voosService.criar(dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /voos — LISTAR
  // ═══════════════════════════════════════════════════════════════
  @Get()
  @ApiOperation({ summary: 'Lista voos com paginação, filtros e ordenação' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  listarTodos(@Query() query: QueryVooDto) {
    return this.voosService.listarTodos(query);
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /voos/:id/clima — CONSULTA CLIMA DO DESTINO (integração externa)
  // ⚠️ Vem ANTES de GET /:id para não conflitar
  // ═══════════════════════════════════════════════════════════════
  @Get(':id/clima')
  @ApiOperation({ summary: 'Consulta o clima atual no destino do voo' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Clima retornado' })
  @ApiResponse({ status: 404, description: 'Voo ou destino não encontrado' })
  @ApiResponse({ status: 503, description: 'API externa indisponível' })
  @ApiResponse({ status: 504, description: 'API externa demorou demais (timeout)' })
  consultarClima(@Param('id', ParseIntPipe) id: number) {
    return this.voosService.consultarClima(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /voos/:id — BUSCAR POR ID
  // ═══════════════════════════════════════════════════════════════
  @Get(':id')
  @ApiOperation({ summary: 'Busca voo por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Voo encontrado' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.voosService.buscarPorId(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /voos/:id/status — MUDAR STATUS
  // ⚠️ Vem ANTES de PATCH /:id para não conflitar
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Muda o status do voo' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateStatusVooDto })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 400, description: 'Transição inválida' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusVooDto,
  ) {
    return this.voosService.atualizarStatus(id, dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /voos/:id — EDITAR
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Atualiza um voo' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateVooDto })
  @ApiResponse({ status: 200, description: 'Voo atualizado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito de portão' })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVooDto,
  ) {
    return this.voosService.atualizar(id, dto);
  }
}
// ═══════════════════════════════════════════════════════════════════
// CompanhiasController — Camada HTTP de Companhias Aéreas
// ═══════════════════════════════════════════════════════════════════
//
// Rotas:
//   POST   /companhias      → criar (OPERATOR ou ADMIN)
//   GET    /companhias      → listar (qualquer autenticado)
//   GET    /companhias/:id  → buscar por id (qualquer autenticado)
//   PATCH  /companhias/:id  → editar (OPERATOR ou ADMIN)
//
// ⚠️ Guards aplicados na classe: TODAS as rotas exigem JWT.
//    Cada rota específica pode adicionar RolesGuard + @Roles.

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { CompanhiasService } from './companhias.service';
import { CreateCompanhiaDto } from './dto/create-companhia.dto';
import { UpdateCompanhiaDto } from './dto/update-companhia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /companhias
@ApiTags('Companhias Aéreas')
@ApiBearerAuth('Bearer Token')
@Controller('companhias')
@UseGuards(JwtAuthGuard) // Toda a classe exige autenticação
export class CompanhiasController {
  constructor(private readonly companhiasService: CompanhiasService) {}

  // ═══════════════════════════════════════════════════════════════
  // POST /companhias — CRIAR (só OPERATOR e ADMIN)
  // ═══════════════════════════════════════════════════════════════
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Cria uma nova companhia aérea' })
  @ApiBody({ type: CreateCompanhiaDto })
  @ApiResponse({ status: 201, description: 'Companhia criada' })
  @ApiResponse({ status: 400, description: 'Código IATA duplicado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  criar(@Body() dto: CreateCompanhiaDto) {
    return this.companhiasService.criar(dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /companhias — LISTAR (qualquer autenticado)
  // ═══════════════════════════════════════════════════════════════
  @Get()
  @ApiOperation({ summary: 'Lista todas as companhias aéreas' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  listarTodas() {
    return this.companhiasService.listarTodas();
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /companhias/:id — BUSCAR POR ID (qualquer autenticado)
  // ═══════════════════════════════════════════════════════════════
  @Get(':id')
  @ApiOperation({ summary: 'Busca companhia por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Companhia encontrada' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.companhiasService.buscarPorId(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /companhias/:id — EDITAR (só OPERATOR e ADMIN)
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Atualiza companhia aérea' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateCompanhiaDto })
  @ApiResponse({ status: 200, description: 'Companhia atualizada' })
  @ApiResponse({ status: 400, description: 'Código IATA duplicado' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanhiaDto,
  ) {
    return this.companhiasService.atualizar(id, dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /companhias/:id/desativar — DESATIVAR (ADMIN)
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id/desativar')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Desativa uma companhia aérea' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Companhia desativada' })
  @ApiResponse({ status: 400, description: 'Já inativa ou possui voos ativos' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  desativar(@Param('id', ParseIntPipe) id: number) {
    return this.companhiasService.desativar(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /companhias/:id/reativar — REATIVAR (ADMIN)
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id/reativar')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reativa uma companhia aérea' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Companhia reativada' })
  @ApiResponse({ status: 400, description: 'Já ativa' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  reativar(@Param('id', ParseIntPipe) id: number) {
    return this.companhiasService.reativar(id);
  }
}
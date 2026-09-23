// ═══════════════════════════════════════════════════════════════════
// AeronavesController — Camada HTTP de Aeronaves
// ═══════════════════════════════════════════════════════════════════
//
// Rotas:
//   POST   /aeronaves      → criar (OPERATOR ou ADMIN)
//   GET    /aeronaves      → listar (qualquer autenticado)
//   GET    /aeronaves/:id  → buscar por id (qualquer autenticado)
//   PATCH  /aeronaves/:id  → editar (OPERATOR ou ADMIN)

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
import { AeronavesService } from './aeronaves.service';
import { CreateAeronaveDto } from './dto/create-aeronave.dto';
import { UpdateAeronaveDto } from './dto/update-aeronave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /aeronaves
@ApiTags('Aeronaves')
@ApiBearerAuth('Bearer Token')
@Controller('aeronaves')
@UseGuards(JwtAuthGuard)
export class AeronavesController {
  constructor(private readonly aeronavesService: AeronavesService) {}

  // ═══════════════════════════════════════════════════════════════
  // POST /aeronaves — CRIAR
  // ═══════════════════════════════════════════════════════════════
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Cria uma nova aeronave' })
  @ApiBody({ type: CreateAeronaveDto })
  @ApiResponse({ status: 201, description: 'Aeronave criada' })
  @ApiResponse({ status: 400, description: 'Matrícula duplicada ou companhia inexistente' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  criar(@Body() dto: CreateAeronaveDto) {
    return this.aeronavesService.criar(dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /aeronaves — LISTAR
  // ═══════════════════════════════════════════════════════════════
  @Get()
  @ApiOperation({ summary: 'Lista todas as aeronaves' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  listarTodas() {
    return this.aeronavesService.listarTodas();
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /aeronaves/:id — BUSCAR POR ID
  // ═══════════════════════════════════════════════════════════════
  @Get(':id')
  @ApiOperation({ summary: 'Busca aeronave por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Aeronave encontrada' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.aeronavesService.buscarPorId(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /aeronaves/:id — EDITAR
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Atualiza aeronave' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateAeronaveDto })
  @ApiResponse({ status: 200, description: 'Aeronave atualizada' })
  @ApiResponse({ status: 400, description: 'Matrícula duplicada ou companhia inexistente' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAeronaveDto,
  ) {
    return this.aeronavesService.atualizar(id, dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /aeronaves/:id/desativar — DESATIVAR (ADMIN)
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id/desativar')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Desativa uma aeronave' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Aeronave desativada' })
  @ApiResponse({ status: 400, description: 'Já inativa ou possui voos ativos' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  desativar(@Param('id', ParseIntPipe) id: number) {
    return this.aeronavesService.desativar(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /aeronaves/:id/reativar — REATIVAR (ADMIN)
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id/reativar')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reativa uma aeronave' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Aeronave reativada' })
  @ApiResponse({ status: 400, description: 'Já ativa' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  reativar(@Param('id', ParseIntPipe) id: number) {
    return this.aeronavesService.reativar(id);
  }
}
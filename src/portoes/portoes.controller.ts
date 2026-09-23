// ═══════════════════════════════════════════════════════════════════
// PortoesController — Camada HTTP de Portões
// ═══════════════════════════════════════════════════════════════════

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
import { PortoesService } from './portoes.service';
import { CreatePortaoDto } from './dto/create-portao.dto';
import { UpdatePortaoDto } from './dto/update-portao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /portoes
@ApiTags('Portões')
@ApiBearerAuth('Bearer Token')
@Controller('portoes')
@UseGuards(JwtAuthGuard)
export class PortoesController {
  constructor(private readonly portoesService: PortoesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Cria um novo portão' })
  @ApiBody({ type: CreatePortaoDto })
  @ApiResponse({ status: 201, description: 'Portão criado' })
  @ApiResponse({ status: 400, description: 'Código duplicado' })
  criar(@Body() dto: CreatePortaoDto) {
    return this.portoesService.criar(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os portões' })
  listarTodos() {
    return this.portoesService.listarTodos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca portão por ID' })
  @ApiParam({ name: 'id', example: 1 })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.portoesService.buscarPorId(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Atualiza portão' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdatePortaoDto })
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePortaoDto,
  ) {
    return this.portoesService.atualizar(id, dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /portoes/:id/desativar — DESATIVAR (ADMIN)
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id/desativar')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Desativa um portão' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Portão desativado' })
  @ApiResponse({ status: 400, description: 'Já inativo ou possui voos ativos' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  desativar(@Param('id', ParseIntPipe) id: number) {
    return this.portoesService.desativar(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /portoes/:id/reativar — REATIVAR (ADMIN)
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id/reativar')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reativa um portão' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Portão reativado' })
  @ApiResponse({ status: 400, description: 'Já ativo' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  reativar(@Param('id', ParseIntPipe) id: number) {
    return this.portoesService.reativar(id);
  }
}
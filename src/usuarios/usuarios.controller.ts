import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Role } from '../../generated/prisma/enums';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /usuarios 
@ApiTags('Usuários')
@ApiBearerAuth('Bearer Token')
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os usuários' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  listarTodos() {
    return this.usuariosService.listarTodos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca usuário por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.buscarPorId(id);
  }

  @Patch(':id/desativar')
  @ApiOperation({ summary: 'Desativa um usuário' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Usuário desativado' })
  @ApiResponse({ status: 400, description: 'Auto-desativação ou já inativo' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  desativar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usuariosService.desativar(id, user.id);
  }

  @Patch(':id/reativar')
  @ApiOperation({ summary: 'Reativa um usuário' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Usuário reativado' })
  @ApiResponse({ status: 400, description: 'Já ativo' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  reativar(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.reativar(id);
  }
}
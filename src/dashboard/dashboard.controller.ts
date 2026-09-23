import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/enums';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /dashboard
@ApiTags('Dashboard')
@ApiBearerAuth('Bearer Token')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OPERATOR, Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('indicadores')
  @ApiOperation({ summary: 'Retorna indicadores agregados do aeroporto' })
  @ApiResponse({ status: 200, description: 'Indicadores retornados' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  indicadores() {
    return this.dashboardService.indicadores();
  }
}
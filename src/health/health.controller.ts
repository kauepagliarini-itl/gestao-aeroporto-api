import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /health
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica a saúde da API e dependências' })
  @ApiResponse({ status: 200, description: 'Status retornado' })
  check() {
    return this.healthService.check();
  }
}
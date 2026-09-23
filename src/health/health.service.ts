import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async check() {
    const [db, climaApi] = await Promise.all([
      this.checkDatabase(),
      this.checkClimaApi(),
    ]);

    const tudoOk = db.status === 'ok' && climaApi.status === 'ok';

    return {
      status: tudoOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSegundos: Math.floor(process.uptime()),
      servicos: {
        database: db,
        climaApi: climaApi,
      },
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' as const };
    } catch (error: any) {
      return { status: 'error' as const, mensagem: error?.message ?? 'erro' };
    }
  }

  private async checkClimaApi() {
    const url = this.configService.get<string>('WEATHER_API_URL');
    if (!url) {
      return { status: 'error' as const, mensagem: 'URL não configurada' };
    }

    try {
      // Chamada leve: só verifica se responde 200
      await firstValueFrom(this.httpService.get(url, { params: { latitude: 0, longitude: 0, current: 'temperature_2m' } }));
      return { status: 'ok' as const };
    } catch (error: any) {
      return { status: 'error' as const, mensagem: error?.message ?? 'erro' };
    }
  }
}
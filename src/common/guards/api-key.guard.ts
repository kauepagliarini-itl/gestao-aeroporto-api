import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Libera Swagger UI e o JSON dos docs
    const path = request.path ?? '';
    if (path.startsWith('/api/docs') || path.startsWith('/api-json')) {
      return true;
    }

    const apiKeyHeader = request.headers['x-api-key'];
    const apiKeyEsperada = this.configService.get<string>('X_API_KEY');

    if (!apiKeyEsperada) {
      throw new UnauthorizedException(
        'X-API-KEY não configurada no servidor',
      );
    }

    if (!apiKeyHeader || apiKeyHeader !== apiKeyEsperada) {
      throw new UnauthorizedException('X-API-KEY inválida ou ausente');
    }

    return true;
  }
}
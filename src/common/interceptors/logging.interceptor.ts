import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl } = request;
    const inicio = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - inicio;
          this.logger.log(
            `${method} ${originalUrl} → ${response.statusCode} (${ms}ms)`,
          );
        },
        error: (err) => {
          const ms = Date.now() - inicio;
          const status = err?.status ?? 500;
          this.logger.warn(
            `${method} ${originalUrl} → ${status} (${ms}ms) - ${err?.message ?? 'erro'}`,
          );
        },
      }),
    );
  }
}
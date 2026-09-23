import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanhiasModule } from './companhias/companhias.module';
import { AeronavesModule } from './aeronaves/aeronaves.module';
import { PortoesModule } from './portoes/portoes.module';
import { VoosModule } from './voos/voos.module';
import { ReservasModule } from './reservas/reservas.module';
import { EmbarquesModule } from './embarques/embarques.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { HealthModule } from './health/health.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { envValidationSchema } from './config/env.validation';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,   // 60 segundos
        limit: 100,   // 100 requisições por IP por minuto
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      } as any,
    }),
    PrismaModule,
    AuthModule,
    CompanhiasModule,
    AeronavesModule,
    PortoesModule,
    VoosModule,
    ReservasModule,
    EmbarquesModule,
    UsuariosModule,
    HealthModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
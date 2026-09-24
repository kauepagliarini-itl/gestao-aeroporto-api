// ═══════════════════════════════════════════════════════════════════
// main.ts — Ponto de entrada da aplicação
// ═══════════════════════════════════════════════════════════════════
//
// Este é o arquivo que roda quando executamos `npm run start:dev`.
// Ele:
//   1. Cria a aplicação NestJS
//   2. Configura middlewares globais (Helmet, Compression, ValidationPipe)
//   3. Habilita CORS
//   4. Serve arquivos estáticos (uploads)
//   5. Configura o Swagger (com suporte a X-API-KEY e Bearer Token)
//   6. Sobe o servidor na porta configurada
//
// ⚠️ ORDEM IMPORTA:
//    Helmet e Compression devem vir CEDO (antes dos pipes),
//    para que apliquem em todas as respostas.

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  // ⚠️ Tipagem como NestExpressApplication para ter acesso
  //    ao método useStaticAssets (servir uploads)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // ═══════════════════════════════════════════════════════════════
  // SEGURANÇA E PERFORMANCE (ordem importa)
  // ═══════════════════════════════════════════════════════════════
  app.use(helmet());
  app.use(compression({ threshold: 1024 }));

  // ═══════════════════════════════════════════════════════════════
  // VALIDAÇÃO GLOBAL (class-validator + DTOs)
  // ═══════════════════════════════════════════════════════════════
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Permite requisições de outras origens (frontend)
  app.enableCors();

  // ═══════════════════════════════════════════════════════════════
  // ARQUIVOS ESTÁTICOS (uploads)
  // Quando alguém acessar /uploads/xxx, o NestJS busca em ./uploads
  // ═══════════════════════════════════════════════════════════════
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ═══════════════════════════════════════════════════════════════
  // SWAGGER (documentação interativa)
  // Disponível em http://localhost:3000/api/docs
  //
  // 🔑 DUAS AUTENTICAÇÕES:
  //    1. X-API-KEY  → header obrigatório em TODAS as rotas
  //    2. Bearer     → token JWT para rotas privadas
  //
  // Ambas aparecem no botão "Authorize" no topo da página.
  // ═══════════════════════════════════════════════════════════════
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gestão de Aeroporto Regional')
    .setDescription(
      'API REST para gestão de aeroporto regional.\n\n' +
        '**Como autenticar:**\n' +
        '1. Clique em **Authorize** no topo\n' +
        '2. Preencha o campo `X-API-KEY` com a chave do arquivo `.env`\n' +
        '3. Faça login em `POST /auth/login` e copie o `token`\n' +
        '4. Cole o token no campo `Bearer Token` (formato: `Bearer <token>`)\n' +
        '5. Pronto — todos os endpoints passam a funcionar',
    )
    .setVersion('1.0')
    // ─── Autenticação 1: X-API-KEY (header obrigatório em tudo) ───
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'Chave da API — valor da variável X_API_KEY no .env',
      },
      'X-API-KEY',
    )
    // ─── Autenticação 2: Bearer Token (rotas privadas) ───
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        in: 'header',
      },
      'Bearer Token',
    )
        // ⚠️ Aplica X-API-KEY como requisito de segurança GLOBAL.
    //    Todas as rotas vão exigir esse header automaticamente.
    .addSecurityRequirements('X-API-KEY')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // ═══════════════════════════════════════════════════════════════
  // CORREÇÃO DA SEMÂNTICA DE SEGURANÇA DO OPENAPI
  // ═══════════════════════════════════════════════════════════════
  // O @nestjs/swagger junta @ApiBearerAuth + @ApiSecurity como
  // entradas SEPARADAS no array "security" — o que significa OR
  // em OpenAPI. O Swagger UI então envia só UM deles.
  //
  // Mas o ApiKeyGuard (global) exige X-API-KEY SEMPRE + Bearer nas
  // rotas privadas → é AND. Precisamos combinar as entradas num
  // único objeto pra corrigir a semântica.
  Object.values(document.paths).forEach((pathItem: any) => {
    Object.values(pathItem).forEach((operation: any) => {
      if (Array.isArray(operation.security) && operation.security.length > 1) {
        const merged = operation.security.reduce(
          (acc: any, s: any) => ({ ...acc, ...s }),
          {},
        );
        operation.security = [merged];
      }
    });
  });

  SwaggerModule.setup('api/docs', app, document);
 
  // ═══════════════════════════════════════════════════════════════
  // START DO SERVIDOR
  // ═══════════════════════════════════════════════════════════════
  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);

  console.log(`🚀 Rodando em http://localhost:${port}`);
  console.log(`📚 Swagger em http://localhost:${port}/api/docs`);
}
bootstrap();
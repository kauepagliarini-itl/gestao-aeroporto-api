// ═══════════════════════════════════════════════════════════════════
// ReservasController — Camada HTTP das Reservas
// ═══════════════════════════════════════════════════════════════════
//
// Rotas:
//   POST   /reservas                  → criar (qualquer autenticado)
//   GET    /reservas/minhas           → minhas reservas
//   GET    /reservas                  → todas (OPERATOR/ADMIN)
//   GET    /reservas/:id              → buscar por id
//   PATCH  /reservas/:id/status       → mudar status (OPERATOR/ADMIN)
//   PATCH  /reservas/:id/cancelar     → cancelar minha reserva
//   POST   /reservas/:id/documento    → anexar documento (upload)
//
// ⚠️ ORDEM DAS ROTAS:
//    "/minhas" deve vir ANTES de "/:id", senão o NestJS interpretaria
//    "minhas" como um ID.

import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiConsumes,
  ApiSecurity,
} from '@nestjs/swagger';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateStatusReservaDto } from './dto/update-status-reserva.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Role } from '../../generated/prisma/enums';
import { multerStorage, fileFilter } from './upload/multer.config';
import { QueryReservaDto } from './dto/query-reserva.dto';

@ApiSecurity('X-API-KEY') // Swagger exige X-API-KEY para acessar /reservas
@ApiTags('Reservas')
@ApiBearerAuth('Bearer Token')
@Controller('reservas')
@UseGuards(JwtAuthGuard)
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  // ═══════════════════════════════════════════════════════════════
  // POST /reservas — CRIAR (qualquer autenticado)
  // ═══════════════════════════════════════════════════════════════
  @Post()
  @ApiOperation({ summary: 'Cria uma nova reserva' })
  @ApiBody({ type: CreateReservaDto })
  @ApiResponse({ status: 201, description: 'Reserva criada' })
  @ApiResponse({ status: 400, description: 'Voo não programado' })
  @ApiResponse({ status: 404, description: 'Voo não encontrado' })
  @ApiResponse({ status: 409, description: 'Sem assentos ou duplicidade' })
  criar(
    @Body() dto: CreateReservaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reservasService.criar(dto, user.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /reservas/minhas — MINHAS RESERVAS
  // ⚠️ Antes de :id
  // ═══════════════════════════════════════════════════════════════
  @Get('minhas')
  @ApiOperation({ summary: 'Lista as reservas do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  listarMinhas(@CurrentUser() user: AuthUser) {
    return this.reservasService.listarMinhas(user.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /reservas — LISTAR TODAS (só OPERATOR/ADMIN)
  // ═══════════════════════════════════════════════════════════════
    @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Lista reservas com paginação e filtros' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  listarTodas(@Query() query: QueryReservaDto) {
    return this.reservasService.listarTodas(query);
  }

  // ═══════════════════════════════════════════════════════════════
  // GET /reservas/:id — BUSCAR POR ID
  // ═══════════════════════════════════════════════════════════════
  @Get(':id')
  @ApiOperation({ summary: 'Busca reserva por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Reserva encontrada' })
  @ApiResponse({ status: 403, description: 'Reserva de terceiro' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reservasService.buscarPorId(id, user.id, user.role);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /reservas/:id/status — MUDAR STATUS (OPERATOR/ADMIN)
  // ⚠️ Antes de :id
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.OPERATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Muda o status da reserva' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateStatusReservaDto })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 400, description: 'Transição inválida' })
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusReservaDto,
  ) {
    return this.reservasService.atualizarStatus(id, dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATCH /reservas/:id/cancelar — CANCELAR MINHA RESERVA
  // ⚠️ Antes de :id
  // ═══════════════════════════════════════════════════════════════
  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancela a própria reserva' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Reserva cancelada' })
  @ApiResponse({ status: 403, description: 'Reserva de terceiro' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  cancelarMinha(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reservasService.cancelarMinha(id, user.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // POST /reservas/:id/documento — ANEXAR DOCUMENTO (upload)
  // ═══════════════════════════════════════════════════════════════
  //
  // ⚠️ Esta rota usa multipart/form-data (NÃO é JSON).
  //    No Thunder Client: aba "Body" → "Multipart Form" → campo
  //    "arquivo" do tipo File.
  //
  // O @UploadedFile + ParseFilePipe valida tamanho ANTES de chegar
  // no service. Se passar, cai em reservasService.anexarDocumento.
  @Post(':id/documento')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: multerStorage,
      fileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Anexa um documento à reserva' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        arquivo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Documento anexado' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Reserva de terceiro' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada' })
  anexarDocumento(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize:
              parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? '5', 10) *
              1024 *
              1024,
            message: 'Arquivo excede o tamanho máximo permitido',
          }),
        ],
      }),
    )
    arquivo: Express.Multer.File,
  ) {
    return this.reservasService.anexarDocumento(id, user.id, arquivo);
  }
}
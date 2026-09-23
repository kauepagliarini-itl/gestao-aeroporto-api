-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PASSENGER', 'OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusVoo" AS ENUM ('PROGRAMADO', 'EMBARCANDO', 'DECOLADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('CONFIRMADA', 'CANCELADA', 'UTILIZADA');

-- CreateEnum
CREATE TYPE "StatusEmbarque" AS ENUM ('PENDENTE', 'REALIZADO', 'BLOQUEADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PASSENGER',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companhias_aereas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "codigoIATA" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companhias_aereas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aeronaves" (
    "id" SERIAL NOT NULL,
    "modelo" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "companhiaId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aeronaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portoes" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "terminal" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voos" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "dataPartida" TIMESTAMP(3) NOT NULL,
    "dataChegada" TIMESTAMP(3) NOT NULL,
    "status" "StatusVoo" NOT NULL DEFAULT 'PROGRAMADO',
    "aeronaveId" INTEGER NOT NULL,
    "portaoId" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "vooId" INTEGER NOT NULL,
    "assento" TEXT NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'CONFIRMADA',
    "documentoUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embarques" (
    "id" SERIAL NOT NULL,
    "reservaId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusEmbarque" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embarques_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companhias_aereas_codigoIATA_key" ON "companhias_aereas"("codigoIATA");

-- CreateIndex
CREATE UNIQUE INDEX "aeronaves_matricula_key" ON "aeronaves"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "portoes_codigo_key" ON "portoes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "voos_numero_key" ON "voos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_vooId_assento_key" ON "reservas"("vooId", "assento");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_usuarioId_vooId_key" ON "reservas"("usuarioId", "vooId");

-- CreateIndex
CREATE UNIQUE INDEX "embarques_reservaId_key" ON "embarques"("reservaId");

-- AddForeignKey
ALTER TABLE "aeronaves" ADD CONSTRAINT "aeronaves_companhiaId_fkey" FOREIGN KEY ("companhiaId") REFERENCES "companhias_aereas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voos" ADD CONSTRAINT "voos_aeronaveId_fkey" FOREIGN KEY ("aeronaveId") REFERENCES "aeronaves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voos" ADD CONSTRAINT "voos_portaoId_fkey" FOREIGN KEY ("portaoId") REFERENCES "portoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_vooId_fkey" FOREIGN KEY ("vooId") REFERENCES "voos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embarques" ADD CONSTRAINT "embarques_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

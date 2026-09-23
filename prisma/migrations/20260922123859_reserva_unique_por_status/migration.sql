/*
  Warnings:

  - A unique constraint covering the columns `[vooId,assento,status]` on the table `reservas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "reservas_vooId_assento_key";

-- CreateIndex
CREATE UNIQUE INDEX "reservas_vooId_assento_status_key" ON "reservas"("vooId", "assento", "status");

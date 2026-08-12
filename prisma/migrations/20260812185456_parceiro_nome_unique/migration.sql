/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `Parceiro` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StatusNegociacao" AS ENUM ('PENDENTE', 'EM_NEGOCIACAO', 'EMBARCADO', 'FINALIZADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "Processo" ADD COLUMN     "status" "StatusNegociacao" NOT NULL DEFAULT 'PENDENTE';

-- CreateIndex
CREATE UNIQUE INDEX "Parceiro_nome_key" ON "Parceiro"("nome");

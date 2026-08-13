-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CategoriaDocumento" ADD VALUE 'ETIQUETA';
ALTER TYPE "CategoriaDocumento" ADD VALUE 'OUTRO';

-- AlterEnum
ALTER TYPE "StatusNegociacao" ADD VALUE 'EM_EXECUCAO';

-- AlterTable
ALTER TABLE "Documento" ADD COLUMN     "descricaoOutro" TEXT;

-- AlterTable
ALTER TABLE "Processo" ADD COLUMN     "armador" TEXT DEFAULT 'ONE',
ADD COLUMN     "containerQtd" INTEGER,
ADD COLUMN     "containerTipo" TEXT DEFAULT '20'' DRY',
ADD COLUMN     "embalagemTipo" TEXT DEFAULT 'Sacaria 30kg',
ADD COLUMN     "estufagemFim" TIMESTAMP(3),
ADD COLUMN     "estufagemInicio" TIMESTAMP(3),
ADD COLUMN     "fumigacaoNecessaria" BOOLEAN,
ADD COLUMN     "fumigacaoTempoHoras" INTEGER DEFAULT 24,
ADD COLUMN     "fumigacaoTipo" TEXT,
ADD COLUMN     "localEstufagem" TEXT,
ADD COLUMN     "mapaNaSequencia" BOOLEAN,
ADD COLUMN     "ncm" TEXT,
ADD COLUMN     "sacasPorContainer" INTEGER;

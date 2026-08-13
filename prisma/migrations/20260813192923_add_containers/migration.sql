-- AlterTable
ALTER TABLE "Processo" ADD COLUMN     "dataEstufagem" TIMESTAMP(3),
ADD COLUMN     "necessitaEtiqueta" BOOLEAN;

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "numeroContainer" TEXT,
    "lacre" TEXT,
    "pesoBruto" DECIMAL(12,3),
    "pesoLiquido" DECIMAL(12,3),
    "totalSacos" INTEGER,
    "tara" DECIMAL(12,3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Container_processoId_ordem_key" ON "Container"("processoId", "ordem");

-- AddForeignKey
ALTER TABLE "Container" ADD CONSTRAINT "Container_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

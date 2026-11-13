-- Adiciona a Etapa 5 (Ajuste Fiscal) ao enum EtapaNotaFiscal de forma idempotente
ALTER TYPE "EtapaNotaFiscal" ADD VALUE IF NOT EXISTS 'ETAPA_5_AJUSTE_FISCAL';

-- Adiciona a coluna usada por salvarCadastroEntidadeAction (lista de fazendas do produtor)
ALTER TABLE "CadastroEntidade" ADD COLUMN IF NOT EXISTS "fazendas" JSONB;

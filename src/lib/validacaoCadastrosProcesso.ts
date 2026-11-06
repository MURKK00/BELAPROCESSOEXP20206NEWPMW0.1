export interface PendenciasCadastrais {
  pendenteImportador: boolean;
  pendenteProdutor: boolean;
  pendenteArmazem: boolean;
  statusTravado: boolean;
  motivos: string[];
  detalhes: {
    importador: string;
    produtor: string;
    armazem: string;
  };
}

export function verificarPendenciasCadastrais(processo: {
  importadorId?: string | null;
  clienteFinal?: string | null;
  enderecoBuyer?: string | null;
  paisBuyer?: string | null;
  produtorId?: string | null;
  fazendaOrigemNome?: string | null;
  armazemId?: string | null;
  siloArmazemOrigem?: string | null;
}): PendenciasCadastrais {
  // Importador: Se não tem importadorId vinculado OU não tem dados de endereço cadastrados
  const pendenteImportador = !processo.importadorId || !processo.enderecoBuyer || !processo.enderecoBuyer.trim();

  // Produtor: Se não tem produtorId vinculado nem fazenda de origem vinculada
  const pendenteProdutor = !processo.produtorId && !processo.fazendaOrigemNome?.trim();

  // Armazém: Se não tem armazemId nem siloArmazemOrigem informado
  const pendenteArmazem = !processo.armazemId && !processo.siloArmazemOrigem?.trim();

  const motivos: string[] = [];
  if (pendenteImportador) motivos.push('Importador (Buyer)');
  if (pendenteProdutor) motivos.push('Produtor (Fazenda)');
  if (pendenteArmazem) motivos.push('Armazém / Silo');

  const statusTravado = pendenteImportador || pendenteProdutor || pendenteArmazem;

  return {
    pendenteImportador,
    pendenteProdutor,
    pendenteArmazem,
    statusTravado,
    motivos,
    detalhes: {
      importador: pendenteImportador
        ? 'Importador sem cadastro completo ou não vinculado à base de entidades.'
        : 'Importador cadastrado',
      produtor: pendenteProdutor
        ? 'Produtor ou fazenda de origem não vinculado.'
        : 'Produtor cadastrado',
      armazem: pendenteArmazem
        ? 'Silo / Armazém de estufagem e beneficiamento não vinculado.'
        : 'Armazém cadastrado',
    },
  };
}

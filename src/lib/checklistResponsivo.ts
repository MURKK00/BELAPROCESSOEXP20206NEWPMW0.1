import { isImportadorPendente } from './compradorHelper';

export interface InfoResponsividade {
  tipo: 'BOOKING' | 'CONTAINERS' | 'NOTAS_FISCAIS' | 'DOCUMENTOS' | 'IMPORTADOR' | 'RASTREABILIDADE' | 'MANUAL';
  concluidaAutomaticamente: boolean;
  motivo: string;
  badgeSufixo?: string;
  linkAba?: string;
  linkTexto?: string;
}

/**
 * Avalia a responsividade de uma etapa do checklist com base nos dados reais do processo:
 * *   -> Vínculo direto com aba Notas Fiscais
 * **  -> Vínculo direto com aba Contêineres
 * *** -> Vínculo direto com aba Documentos
 * ****-> Vínculo direto com Booking na Visão Geral
 */
export function avaliarResponsividadeEtapa(
  etapaNome: string,
  processo: any
): InfoResponsividade {
  const nomeLower = etapaNome.toLowerCase();

  // 1. **** Emissão Booking
  if (nomeLower.includes('booking') || nomeLower.includes('****')) {
    const hasBooking = Boolean(
      processo.bookingNumero && 
      processo.bookingNumero.trim() !== '' && 
      processo.bookingNumero !== 'A definir' && 
      processo.bookingNumero !== 'Pendente'
    );
    return {
      tipo: 'BOOKING',
      concluidaAutomaticamente: hasBooking,
      motivo: hasBooking
        ? `Booking "${processo.bookingNumero}" cadastrado na Visão Geral`
        : 'Pendente número de Booking nos prazos da Visão Geral',
      badgeSufixo: '****',
      linkTexto: hasBooking ? 'Booking Ativo' : 'Preencher Booking',
    };
  }

  // 2. Preencher campo Importador
  if (nomeLower.includes('importador')) {
    const hasImportador = !isImportadorPendente(processo);
    return {
      tipo: 'IMPORTADOR',
      concluidaAutomaticamente: hasImportador,
      motivo: hasImportador
        ? `Importador cadastrado (${processo.clienteFinal})`
        : 'Pendente preenchimento de endereço e dados fiscais do Importador',
      linkAba: `/negociacoes/${processo.id}/importador`,
      linkTexto: hasImportador ? 'Aba Importador' : 'Preencher Importador →',
    };
  }

  // 3. Preencher campo Rastreabilidade
  if (nomeLower.includes('rastreabilidade')) {
    const hasRastreabilidade = Boolean(
      processo.produtorId ||
      processo.carNumero ||
      processo.fazendaNome ||
      processo.siloArmazem ||
      processo.cnpjArmazem ||
      processo.produtor
    );
    return {
      tipo: 'RASTREABILIDADE',
      concluidaAutomaticamente: hasRastreabilidade,
      motivo: hasRastreabilidade
        ? 'Dados de produtor, CAR ou armazém vinculados'
        : 'Pendente seleção do produtor/origem do grão',
      linkAba: `/negociacoes/${processo.id}/rastreabilidade`,
      linkTexto: hasRastreabilidade ? 'Aba Rastreabilidade' : 'Preencher Rastreabilidade →',
    };
  }

  // 4. ** Preencher Contêineres
  if (nomeLower.includes('contêiner') || nomeLower.includes('conteiner') || nomeLower.includes('**')) {
    const containers = processo.containers || [];
    const preenchidos = containers.filter((c: any) => Boolean(c.numeroContainer && c.numeroContainer.trim() !== ''));
    const hasContainers = preenchidos.length > 0;
    return {
      tipo: 'CONTAINERS',
      concluidaAutomaticamente: hasContainers,
      motivo: hasContainers
        ? `${preenchidos.length} de ${containers.length} contêiner(es) identificados na aba Contêineres`
        : 'Nenhum contêiner numerado ainda na aba Contêineres',
      badgeSufixo: '**',
      linkAba: `/negociacoes/${processo.id}/containers`,
      linkTexto: hasContainers ? 'Ver Contêineres' : 'Preencher Contêineres →',
    };
  }

  // 5. * Notas Fiscais #1 - Formação Lote
  if (nomeLower.includes('notas fiscais #1') || (nomeLower.includes('formação lote') && nomeLower.includes('*'))) {
    const nfs = processo.notasFiscais || [];
    const hasNf1 = nfs.some((n: any) => n.tipo === 'ENTRADA' || !n.tipo || n.tipo === 'REMESSA_LOTE');
    return {
      tipo: 'NOTAS_FISCAIS',
      concluidaAutomaticamente: hasNf1,
      motivo: hasNf1
        ? 'Nota Fiscal de Formação de Lote lançada na aba Notas Fiscais'
        : 'Pendente emissão da NF #1 de formação de lote',
      badgeSufixo: '*',
      linkAba: `/negociacoes/${processo.id}/notas-fiscais`,
      linkTexto: hasNf1 ? 'Ver Notas Fiscais' : 'Lançar NF #1 →',
    };
  }

  // 6. * Notas Fiscais #2 - Retorno lote
  if (nomeLower.includes('notas fiscais #2') || (nomeLower.includes('retorno lote') && nomeLower.includes('*'))) {
    const nfsRetorno = processo.notasFiscaisRetorno || [];
    const nfs = processo.notasFiscais || [];
    const hasNf2 = nfsRetorno.length > 0 || nfs.some((n: any) => n.tipo === 'RETORNO');
    return {
      tipo: 'NOTAS_FISCAIS',
      concluidaAutomaticamente: hasNf2,
      motivo: hasNf2
        ? 'Nota Fiscal de Retorno de Lote lançada na aba Notas Fiscais'
        : 'Pendente emissão da NF #2 de retorno de lote',
      badgeSufixo: '*',
      linkAba: `/negociacoes/${processo.id}/notas-fiscais`,
      linkTexto: hasNf2 ? 'Ver NF Retorno' : 'Lançar NF #2 Retorno →',
    };
  }

  // 7. * Notas Fiscais #3 - Exportação (DU-E)
  if (nomeLower.includes('notas fiscais #3') || (nomeLower.includes('exportação (du-e)') && nomeLower.includes('*'))) {
    const nfsExport = processo.notasFiscaisExportacaoItens || [];
    const nfs = processo.notasFiscais || [];
    const hasNf3 = nfsExport.length > 0 || nfs.some((n: any) => n.tipo === 'EXPORTACAO' || Boolean(n.chaveAcesso && n.chaveAcesso.length > 20));
    return {
      tipo: 'NOTAS_FISCAIS',
      concluidaAutomaticamente: hasNf3,
      motivo: hasNf3
        ? 'Nota Fiscal de Exportação (DU-E) lançada na aba Notas Fiscais'
        : 'Pendente emissão da NF #3 de exportação na aba Notas Fiscais',
      badgeSufixo: '*',
      linkAba: `/negociacoes/${processo.id}/notas-fiscais`,
      linkTexto: hasNf3 ? 'Ver NF Exportação' : 'Lançar NF #3 Exportação →',
    };
  }

  // 8. Etiquetagem
  if (nomeLower.includes('etiquetagem')) {
    const temEtiquetagem = processo.temEtiquetagem ?? false;
    return {
      tipo: 'MANUAL',
      concluidaAutomaticamente: !temEtiquetagem, // Se não for requerida, é dispensada
      motivo: temEtiquetagem ? 'Etiquetagem requerida no contrato' : 'Não exigida para este processo (Dispensada)',
      linkTexto: temEtiquetagem ? 'Requerida' : 'Dispensada',
    };
  }

  // 9. *** Documentos (12 existentes)
  if (nomeLower.includes('***') || nomeLower.includes('bl original') || nomeLower.includes('packing list') || nomeLower.includes('invoice') || nomeLower.includes('non-gmo') || nomeLower.includes('câmbio') || nomeLower.includes('cambio')) {
    const docs = processo.documentos || [];
    const termoLimpo = etapaNome.replace(/\*/g, '').trim().toLowerCase();
    const docEncontrado = docs.some((d: any) => {
      const dNome = (d.tipoDocumento?.nome || d.nome || '').toLowerCase();
      return dNome.includes(termoLimpo) || termoLimpo.includes(dNome) || (termoLimpo.includes('du-e') && dNome.includes('du-e'));
    });

    return {
      tipo: 'DOCUMENTOS',
      concluidaAutomaticamente: docEncontrado,
      motivo: docEncontrado
        ? 'Documento localizado e aprovado no GED'
        : 'Pendente upload/emissão na aba Documentos & GED',
      badgeSufixo: '***',
      linkAba: `/negociacoes/${processo.id}/documentos`,
      linkTexto: docEncontrado ? 'Ver no GED' : 'Upload na aba Documentos →',
    };
  }

  return {
    tipo: 'MANUAL',
    concluidaAutomaticamente: false,
    motivo: 'Ação manual do operador',
  };
}

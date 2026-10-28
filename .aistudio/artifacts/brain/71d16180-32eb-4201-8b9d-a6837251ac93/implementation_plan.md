# Importação e Anexo de NFs em Lote por XML (Etapas 1, 2 e 3)

Implementação da funcionalidade de upload em lote de múltiplos arquivos XML de NF-e (Nota Fiscal Eletrônica), com extração e parsing automático dos dados fiscais (chave de 44 dígitos, número, série, emissão, emitente, destinatário, CFOP, peso líquido/bruto, volumes e valores), pré-visualização em tabela editável antes da confirmação, sugestão inteligente de vínculo na Etapa 2 e lançamento direto nos registros da negociação.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisões operacionais confirmadas com o usuário:
> - **Pré-visualização e Revisão Antes da Gravação**: Os arquivos XML enviados serão imediatamente parseados e exibidos em uma gaveta/tabela de pré-visualização interativa para que o usuário possa revisar dados, corrigir inconsistências ou desmarcar notas indesejadas antes de salvar.
> - **Etapa 2 (Retorno de Armazenagem) - Vínculo Inteligente com Ajuste Manual**: O sistema cruzará automaticamente o CNPJ e a Razão Social do emitente/destinatário do XML com as NFs da Etapa 1 já lançadas no processo, sugerindo os vínculos de retorno correspondentes e permitindo ajuste manual direto na tabela de pré-visualização.
> - **Formato de Envio**: Seleção múltipla e arrastar/soltar (*drag & drop*) de arquivos `.xml`.
> - **Etapa 3 (Formação de Lote REDEX)**: Cada nota importada em lote terá seu saldo disponível iniciado automaticamente com o seu peso líquido (kg), pronta para receber os abatimentos das estufagens de contêineres na Etapa 4.

---

## 1. Overview & Core Concept

### O que o recurso entrega
Permite que o operador de exportação e a equipe fiscal anexem e processem dezenas de XMLs de NF-e simultaneamente em qualquer uma das três primeiras etapas da triangulação fiscal:
- **Etapa 1 (Entrada para a Indústria)**: Remessas de produtores e parceiros para depósito e beneficiamento.
- **Etapa 2 (Retorno de Armazenagem da Indústria)**: Notas fiscais de retorno emitidas pela indústria, cruzando com as entradas para conferência do balanço físico.
- **Etapa 3 (Formação de Lote no REDEX)**: Remessas para armazém/terminal alfandegado, inicializando o saldo disponível para estufagem em contêineres.

### Valor Agregado
- Elimina a digitação manual de chaves de 44 dígitos, CNPJs, pesos e valores.
- Reduz a zero os erros de digitação e divergências entre o XML emitido na SEFAZ e os registros internos.
- Preserva o arquivo XML original indexado à nota fiscal para conformidade fiscal e auditoria.

---

## 2. User Experience & Visual Design

### Fluxo de Trabalho (Passo a Passo)

```
┌────────────────────────────────┐
│  Aba "Notas Fiscais"           │
│  Botão "Importar Lote de XML"  │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│  Modal / Drag & Drop Zone      │
│  - Seleção de múltiplos .xml   │
│  - Seleção da Etapa (1, 2 ou 3)│
└───────────────┬────────────────┘
                │ Parser XML no cliente/servidor
                ▼
┌────────────────────────────────────────────────────────┐
│  Tabela de Pré-Visualização e Conferência              │
│  - Total de arquivos lidos com sucesso / erros         │
│  - Resumo de volume total (kg) e valor total (R$)      │
│  - Linhas com NF, Chave 44d, Emitente, Peso Líquido    │
│  - Se Etapa 2: Seletor de NF de Entrada vinculada      │
│  - Checkbox para incluir/remover linhas do lote        │
└───────────────┬────────────────────────────────────────┘
                │ Confirmação do Lote
                ▼
┌────────────────────────────────────────────────────────┐
│  Gravação no Banco & Notificação de Sucesso            │
│  - NFs inseridas com status "Autorizada" e XML anexado │
│  - Saldo da Etapa 3 aberto e pronto para estufagem     │
│  - Atualização instantânea dos 3 cards de resumo       │
└────────────────────────────────────────────────────────┘
```

### Elementos da Interface
- **Botão "Importar Lote XML"**: Presente na barra de ações principal e em cada uma das seções das Etapas 1, 2 e 3 para acesso rápido contextualizado.
- **Área de Drag & Drop Responsiva**: Área com visual tracejado elegante, aceitando arrastar múltiplos arquivos `.xml` ou botão de seleção tradicional (`input type="file" multiple accept=".xml"`).
- **Tabela de Pré-Visualização e Validação**:
  - Destaque numérico dos totais parseados: `Quantidade de NFs`, `Soma Peso Líquido (kg)`, `Soma Valor R$`.
  - Sinalizador de status por linha: verde (dados completos e válidos) ou amarelo (alerta de duplicidade de chave ou campos ausentes).
  - Formatação monospace para CNPJs, chaves de 44 dígitos e valores numéricos tabulares (`font-mono tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

- **Parser Híbrido Resiliente (Browser + API Backend)**:
  - *Decisão*: O parser de XML é executado no navegador via `DOMParser` nativo para resposta imediata (0ms de latência de rede na leitura de dezenas de arquivos) e conferência visual instantânea, e a validação final é re-executada no backend ao gravar em lote via transação atômica.
  - *Benefício*: O usuário não precisa aguardar upload de arquivos pesados para visualizar a tabela resumida.
- **Tratamento de Padrões XML de NF-e**:
  - O extrator busca as tags padrão da SEFAZ:
    - `<chNFe>` ou atributo `Id` de `<infNFe>` (chave de acesso).
    - `<nNF>` (número da nota), `<serie>`.
    - `<dhEmi>` ou `<dEmi>` (data de emissão).
    - `<emit><xNome>` e `<emit><CNPJ>` (emitente).
    - `<dest><xNome>` e `<dest><CNPJ>` (destinatário).
    - `<det><prod><CFOP>` (CFOP principal).
    - `<transp><vol><pesoL>` (peso líquido) e `<pesoB>` (peso bruto).
    - `<transp><vol><qVol>` (quantidade de sacas/volumes).
    - `<total><ICMSTot><vNF>` (valor total).
- **Tratamento de Duplicidades**:
  - Se um XML tiver uma chave de acesso que já existe cadastrada naquela negociação, a linha é sinalizada com um aviso de "Chave já cadastrada" permitindo desmarcá-la antes da importação.

---

## 4. Technical Architecture & Data Strategy

### Diagrama de Arquitetura

```
┌───────────────────────────────────────────────────────────────┐
│ Client-side (ModalImportarLoteXml.tsx)                        │
│ 1. Drag & drop múltiplos arquivos .xml                        │
│ 2. parseNFeXml() extrai tags SEFAZ                            │
│ 3. Sugere vínculo Etapa 2 cruzando com etapa1Notas[]          │
│ 4. Tabela de conferência com totais calculados                │
└───────────────────────────────┬───────────────────────────────┘
                                │ POST /api/negociacoes/[id]/notas-fiscais/lote
                                ▼
┌───────────────────────────────────────────────────────────────┐
│ API Backend (route.ts)                                        │
│ 1. Validação de sessão e permissões do usuário                │
│ 2. Verificação de chaves duplicadas no banco                  │
│ 3. Execução em $transaction:                                  │
│    - Criação das notas fiscais da etapa correspondente        │
│    - Criação dos NotaFiscalRetornoItem (se Etapa 2)           │
│    - Inicialização de saldoDisponivelKg = pesoLiquido (Et. 3) │
│    - Registro de log na trilha de auditoria (AuditLog)        │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│ Banco de Dados / Prisma Store                                 │
│ - Tabela NotaFiscal (registros criados em lote)               │
│ - Tabela NotaFiscalRetornoItem (vínculos criados)             │
│ - dev-store.json / demo-store.json persistidos                │
└───────────────────────────────────────────────────────────────┘
```

### Componentes e Endpoints Planejados
1. **Helper de Parsing SEFAZ**: `src/lib/xmlNfeParser.ts`
   - Leitor completo de estruturas `<nfeProc>` e `<NFe>` da SEFAZ, com sanitização de pesos, números e datas ISO.
2. **Endpoint de Importação em Lote**: `POST /api/negociacoes/[id]/notas-fiscais/lote`
   - Recebe array de notas parseadas com seus respectivos anexos e vínculos da Etapa 2, validando e persistindo via Prisma `$transaction`.
3. **Componente de UI Modal**: `src/components/negociacoes/notas-fiscais/ModalImportarLoteXml.tsx`
   - Modal com dropzone, tabela expansível de revisão, conferência de pesos e soma total, seletor de vínculo para a Etapa 2 e botão de importação com barra de progresso.
4. **Integração no Dashboard**: `src/components/negociacoes/notas-fiscais/NotasFiscaisDashboard.tsx`
   - Botão "Importar Lote XML" no cabeçalho geral e botões contextuais por etapa (Etapa 1, Etapa 2 e Etapa 3).

---

## 5. Status da Implementação

- [x] Extrator e Parser de XML SEFAZ (`xmlNfeParser.ts`)
- [x] Endpoint de Processamento e Gravação em Lote (`/api/negociacoes/[id]/notas-fiscais/lote`)
- [x] Interface Modal de Importação com Drag & Drop e Pré-visualização (`ModalImportarLoteXml.tsx`)
- [x] Integração Contextual nos Cabeçalhos das Etapas 1, 2 e 3 (`NotasFiscaisDashboard.tsx`)
- [x] Compilação e validação do sistema concluídas com sucesso.

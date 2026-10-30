# Plano de Implementação: Rastreabilidade do Trajeto do Grão & Central Unificada de Cadastros (Produtores, Importadores e Buyers)

Este plano detalha a arquitetura, modelo de dados e componentes de interface para o cadastro unificado de parceiros comerciais e a rastreabilidade intermodal completa do grão na exportação da **Bela Cereais**.

---

## 1. Visão Geral da Solução

O mecanismo atenderá a três pilares estratégicos:
1. **Central Unificada de Cadastros na Visão Geral**: Botão de acesso rápido no cabeçalho do dashboard (`/`) abrindo um modal completo e ágil para gerenciar **Produtores Rurais**, **Importadores** e **Buyers (Compradores)**.
2. **Integração na Aba do Importador (`/negociacoes/[id]/importador`)**: Seletor inteligente para puxar dados cadastrados, atalho direto para cadastrar novos importadores e opção de salvar/editar as informações diretamente no banco de dados.
3. **Nova Aba: Rastreabilidade & Trajeto do Grão (`/negociacoes/[id]/rastreabilidade`)**: Mapeamento do fluxo intermodal da carga (Fazenda do Produtor com CAR e Inscrição Estadual $\rightarrow$ Silo/Armazém $\rightarrow$ Transbordo $\rightarrow$ Porto de Embarque $\rightarrow$ Porto de Destino Internacional).

---

## 2. Arquitetura de Dados (Prisma & Banco de Dados)

### A. Novo Modelo: `CadastroEntidade`
Criação de entidade unificada para cadastro comercial e conformidade socioambiental:
```prisma
enum TipoEntidadeComercial {
  PRODUTOR
  IMPORTADOR
  BUYER
}

model CadastroEntidade {
  id                    String                @id @default(cuid())
  tipo                  TipoEntidadeComercial @default(PRODUTOR)
  razaoSocial           String
  nomeFantasia          String?
  documentoIdentificacao String?               // CPF ou CNPJ (Brasil) ou Tax ID internacional
  
  // Dados de Rastreabilidade Agrícola (Produtor Rural)
  inscricaoEstadual     String?               // Obrigatório para triangulação e notas fiscais
  carNumero             String?               // Cadastro Ambiental Rural (conformidade EUDR / rastreabilidade)
  nomePropriedade       String?               // Ex: Fazenda Bela Vista, Gleba X
  municipio             String?               // Ex: Confresa, Querência, Sinop
  uf                    String?               // Ex: MT, GO, TO
  coordenadasGps        String?               // Lat/Long para georreferenciamento do grão
  areaHectares          Decimal?              @db.Decimal(10, 2)
  culturaPrincipal      String?               // Soja, Milho, Gergelim, Feijão, Algodão

  // Dados de Comércio Exterior (Importador / Buyer)
  pais                  String?               @default("Brasil")
  endereco              String?
  complemento           String?
  bairro                String?
  cep                   String?
  cidadeInternacional   String?
  iecTaxId              String?               // IEC Code (Índia/Ásia)
  fassaiId              String?               // FASSAI (Alimentos/Índia)
  panId                 String?               // PAN Card
  gstId                 String?               // GST Number
  email                 String?
  telefone              String?
  contatoResponsavel    String?

  // Dados Bancários Vinculados (Destino / Liquidação)
  bancoNome             String?
  bancoSwift            String?
  bancoConta            String?
  bancoEndereco         String?

  ativo                 Boolean               @default(true)
  observacoes           String?               @db.Text
  criadoEm              DateTime              @default(now())
  atualizadoEm          DateTime              @updatedAt

  processosComoProdutor    Processo[]         @relation("ProcessoProdutor")
  processosComoImportador  Processo[]         @relation("ProcessoImportador")
}
```

### B. Vínculo no Modelo `Processo` (Negociação)
Adição de chaves e campos de trajeto no modelo `Processo`:
- `produtorId`: String? (relacionamento com `CadastroEntidade`)
- `importadorId`: String? (relacionamento com `CadastroEntidade`)
- `fazendaOrigemNome`: String? (cache rápido)
- `produtorCarCache`: String? (cache do CAR)
- `produtorIeCache`: String? (cache da Inscrição Estadual)
- `trajetoStatus`: String? (`FAZENDA`, `SILO_ARMAZEM`, `TRANSBORDO_FERROVIA`, `TERMINAL_REDEX`, `PORTO_EMBARCADO`)
- `siloArmazemOrigem`: String? (ex: Silo Bela Cereais Confresa)
- `terminalTransbordo`: String? (ex: Pátio VLI Palmeirante / Rumo Rondonópolis)

---

## 3. Componentes e Telas

### A. Central de Cadastros na "Visão Geral" (`/src/app/(dashboard)/page.tsx`)
- **Botão "Cadastros"**: Localizado no cabeçalho superior direito da Visão Geral ao lado de `+ Nova Negociação`.
- **Modal Unificado (`CentralCadastrosModal.tsx`)**:
  - Segmented Switcher no topo: `[ 🌾 Produtor Rural ] [ 🏢 Importador ] [ 🌐 Buyer ]`.
  - Barra de busca rápida com filtro por nome, CPF/CNPJ, CAR ou Tax ID.
  - Tabela resumida dos registros ativos com botões para Editar e Criar Novo.
  - Formulário dinâmico em 2 colunas com validações adequadas para cada perfil:
    - *Produtor*: Razão Social, CNPJ/CPF, Inscrição Estadual, CAR da Propriedade, Nome da Fazenda, Município/UF, Área.
    - *Importador/Buyer*: Razão Social, País, Endereço, IEC, FASSAI, PAN, GST, E-mail, Telefone, Banco e SWIFT.

### B. Integração e Sincronização na Aba do Importador (`ImportadorCard.tsx`)
- **Seletor de Importador Cadastrado**:
  - Dropdown inteligente no topo do card com pesquisa por nome ou país.
  - Ao selecionar, preenche automaticamente todos os dados (`clienteFinal`, endereço, país, IEC, FASSAI, dados bancários).
- **Atalho Rápido "+ Novo Importador"**:
  - Abre modal direto sem sair do fluxo da negociação.
- **Botão de Salvamento Duplo**:
  - Permite salvar apenas na negociação ou salvar e sincronizar a alteração no cadastro geral da entidade.

### C. Nova Aba: "Rastreabilidade & Trajeto do Grão" (`/negociacoes/[id]/rastreabilidade`)
- Inserida na navegação de abas (`NegociacaoTabs.tsx`) com ícone de rota.
- **Mapeamento Visual do Trajeto Intermodal do Grão**:
  - **Etapa 1 - Origem na Fazenda (Produtor Rural)**:
    - Card com Produtor vinculado, Inscrição Estadual e **CAR (Cadastro Ambiental Rural)** com badge de conformidade.
    - Localização geográfica (Município, UF, Coordenadas GPS).
  - **Etapa 2 - Armazenagem & Classificação**:
    - Silo / Armazém de consolidação e dados de umidade/impureza da safra.
  - **Etapa 3 - Transporte & Transbordo**:
    - Modal rodoviário até transbordo ferroviário (Rumo/VLI) ou direto ao Porto.
  - **Etapa 4 - Porto de Embarque & Estufagem**:
    - Terminal Portuário (Santos, Paranaguá, Barcarena), armador e contêineres vinculados.
  - **Etapa 5 - Travessia Marítima & Destino Final**:
    - Navio, Porto de Destino e Importador/Buyer consignatário.

---

## 4. APIs e Server Actions

- `/api/cadastros`: Endpoints REST (`GET`, `POST`, `PUT`, `DELETE`) para o CRUD unificado de parceiros.
- `/api/negociacoes/[id]/rastreabilidade`: Endpoint para vincular e atualizar dados de trajeto e produtor da negociação.
- `src/server/actions/cadastrosActions.ts`: Server Actions para criar e atualizar parceiros diretamente via formulários do Next.js 15.

---

## 5. Sequência de Execução

1. **Prisma Schema & Migração**: Adicionar `CadastroEntidade` e as relações no `Processo`. Executar `prisma generate` e `prisma db push`.
2. **Seeds & Mock Data Inicial**: Alimentar alguns produtores rurais (com CAR e IE de MT/TO) e importadores conhecidos para teste imediato.
3. **APIs e Server Actions**: Criar `cadastrosActions.ts` e `/api/cadastros/route.ts`.
4. **Interface da Central de Cadastros**: Criar `CentralCadastrosModal.tsx` e integrar o botão na Visão Geral (`page.tsx`).
5. **Aprimoramento da Aba Importador**: Atualizar `ImportadorCard.tsx` com o seletor de cadastrados e atalho de novo cadastro.
6. **Implementação da Aba Rastreabilidade**: Criar a rota `/negociacoes/[id]/rastreabilidade` e o componente de trajeto intermodal.
7. **Verificação & Testes**: Executar `lint_applet` e `compile_applet`, validando o fluxo completo de cadastro, vinculação e exibição do trajeto.

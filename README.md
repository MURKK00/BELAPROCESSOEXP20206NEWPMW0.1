# Bela Cereais — Sistema de Exportação

Sistema de gestão do processo de exportação (Comercial → Indústria →
Booking/REDEX → Documentação → Fechamento Bancário), construído a partir de:

- `PROCESSO DE EXPORTACAO - BELA CEREAIS.docx` — mapeamento por fase
- `Backlog_Exportacao_Feijoes_FINAL.xlsx` — as 48 etapas do processo, raias,
  parceiros externos e sugestão de automação (aba "Backlog Automação"), a
  taxonomia de documentos do GED (aba "Estrutura GED") e os primeiros passos
  de automação via n8n
- `ged_exportacao_v9.html` — protótipo visual usado para validar a ideia com
  o time (não é mais a fonte de dados do sistema — ver seção **O que mudou**)

## Stack

- **Next.js 15 (App Router) + TypeScript** — front-end e API no mesmo
  projeto, deploy direto na Vercel.
- **Prisma + PostgreSQL (Supabase ou Neon)** — banco gerenciado, sem servidor
  próprio.
- **Supabase Storage** (ou bucket equivalente) — armazenamento dos documentos
  do GED, seguindo a convenção de pastas já definida na planilha.
- **NextAuth (Auth.js)** — autenticação, com papéis (Comercial,
  Administrativo, Financeiro, Diretoria).
- **n8n** (externo, já em uso pela empresa) — automações de captura/arquivo
  de e-mail e certificados, conversando com o sistema via
  `POST /api/webhooks/n8n`.

## Estrutura de pastas

```
bela-cereais-export/
├── prisma/
│   ├── schema.prisma        # modelo de dados completo (ver abaixo)
│   └── seed.ts               # popula EtapaTemplate a partir das 48 etapas da planilha
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/       # shell autenticado (sidebar + área principal)
│   │   │   ├── page.tsx                     # Visão Geral (dashboard)
│   │   │   ├── negociacoes/
│   │   │   │   ├── page.tsx                 # lista de processos
│   │   │   │   ├── nova/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx             # tab Visão Geral
│   │   │   │       ├── financeiro/page.tsx  # tab DRE
│   │   │   │       ├── checklist/page.tsx   # gerado de ProcessoEtapa, não hardcoded
│   │   │   │       ├── documentos/page.tsx  # GED do processo
│   │   │   │       ├── chat/page.tsx
│   │   │   │       └── auditoria/page.tsx
│   │   │   ├── logistica/page.tsx
│   │   │   └── documentos/page.tsx          # GED global (todos os processos)
│   │   └── api/
│   │       ├── processos/                   # CRUD de processos + sub-recursos
│   │       └── webhooks/n8n/route.ts        # entrada de eventos de automação
│   ├── components/            # 1 pasta por domínio (negociacoes, financeiro, checklist...)
│   ├── lib/                   # prisma client, auth, formatters, workflow (regra de status/deadline)
│   ├── server/services/       # regra de negócio isolada da camada HTTP
│   └── types/
└── .env.example
```

## Modelo de dados — o que muda de verdade

O protótipo HTML tratava cada negociação como um objeto solto com um
`status` de texto escolhido manualmente e um checklist de `<li>` fixo no
HTML. Isso funciona pra apresentar a ideia, mas diverge da realidade assim
que alguém esquece de clicar em algo.

A arquitetura real gira em torno de duas tabelas:

- **`EtapaTemplate`** — as 48 etapas da planilha "Backlog Automação",
  seedadas uma vez como configuração (fase, raia responsável, parceiro
  externo, se gera documento, nível de automação sugerido).
- **`ProcessoEtapa`** — a instância dessas etapas em cada processo real.
  Toda negociação nova (`criarProcesso` em
  `src/server/services/processoService.ts`) já nasce com as 48 linhas
  instanciadas como `PENDENTE`.

A partir disso:
- o **status do processo** (`Criado` / `Docs Pendentes` / `Embarcando` /
  `Concluído`) é **calculado** (`src/lib/workflow.ts#deriveStatusProcesso`),
  nunca digitado;
- o **checklist** por processo é uma query filtrando `ProcessoEtapa` pela
  fase, não uma lista fixa por tab;
- o **dashboard** e o **próximo deadline** vêm de dados reais, não de um
  array mockado ordenado na mão.

Outras correções em relação ao rascunho:

| Rascunho HTML | Sistema real |
|---|---|
| Custos num objeto JSON solto, editado via `prompt()` do navegador | `CustoItem` — uma linha por categoria de custo, com quem editou e quando |
| Valores em `float` | `Decimal` no Postgres (`@db.Decimal`) — sem erro de arredondamento em câmbio/PTAX |
| Log de auditoria montado no `localStorage`/JS do cliente, com usuário fixo `"Murillo"` | `AuditLog` gravado **no servidor**, a partir da sessão autenticada |
| Parceiros (Buonny, CROMO, SCAN...) como texto solto | `Parceiro` — entidade própria, reaproveitada em várias etapas |
| Upload de documento genérico | `Documento` com caminho de armazenamento seguindo a convenção já definida na aba "Estrutura GED" (`processos/{numeroProcesso}/{fase}/{tipo}_{data}.ext`) |
| Nenhuma ligação com n8n | `POST /api/webhooks/n8n` + tabela `WebhookEvent` para rastrear toda automação recebida |

## Papéis de acesso (a definir com o time)

- **Comercial** — cria negociação, fecha contrato.
- **Administrativo** — conduz o processo (a maior parte das 48 etapas).
- **Financeiro** — edita DRE, fechamento de câmbio.
- **Diretoria** — aprova exceções (ex: motorista fora do risco aceitável).
- **Cliente (fase 2)** — portal só-leitura para aprovar o pacote de
  documentos (etapa 44-B da planilha), substituindo o e-mail manual.

## Como rodar (depois de `npm install`)

```bash
cp .env.example .env        # preencher DATABASE_URL etc
npx prisma migrate dev      # cria as tabelas
npm run db:seed             # popula EtapaTemplate, Parceiro, TipoDocumento
npm run dev
```

## Próximos passos reais (nesta ordem)

1. **Portar as 48 linhas completas** da aba "Backlog Automação" para
   `prisma/seed.ts` (hoje só tem uma amostra representativa de cada fase).
2. Decidir o provedor de auth (Google Workspace da empresa? e-mail/senha
   interno?) e implementar `src/lib/auth.ts`.
3. Construir as telas do `(dashboard)` reaproveitando a UI do protótipo
   (o visual pode ficar praticamente igual — o que muda é de onde os dados
   vêm).
4. Configurar bucket de Storage (Supabase) e ligar `buildDocumentStoragePath`
   ao upload real.
5. Alinhar com quem mexe no n8n os payloads exatos que cada fluxo da aba
   "Primeiros Passos n8n" vai mandar pro webhook.

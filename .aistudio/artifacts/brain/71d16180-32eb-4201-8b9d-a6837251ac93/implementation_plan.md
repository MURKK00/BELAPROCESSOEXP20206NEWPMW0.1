# Gerenciamento de Sessão, Alerta de Ociosidade e Timeout Absoluto (12h)

Implementação robusta do ciclo de vida de autenticação, persistência segura em cookies de sessão, renovação silenciosa em background (sliding session), alerta interativo de ociosidade com contagem regressiva aos 9m30s, e limite absoluto estrito de 12 horas para encerramento obrigatório no dia seguinte.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões confirmadas com o usuário:**
> - **Tempo de Inatividade:** 10 minutos no total, com o modal de alerta disparando faltando 30 segundos (aos 9m30s de inatividade).
> - **Limite Absoluto (Absolute Timeout):** Exatamente 12 horas corridas a partir do momento inicial do login, sem extensão infinita.
> - **Ação ao Zerar a Contagem de 30s:** Bloqueio da tela solicitando senha do usuário (com a tela de bloqueio corporativa PEX). Caso o limite absoluto de 12h seja atingido, ocorre logoff definitivo e redirecionamento para `/login`.
> - **Isenção Especial:** A tela `Backoffice Cockpit` (`/backoffice`) e a tela de login permanecem isentas do bloqueio por inatividade, garantindo operação contínua de monitoramento em telões e estações de comando.

---

### 1. Overview & Core Concept

- **O que faz:** Protege o acesso à plataforma PEX Agritech / Bela Cereais mantendo a conveniência do usuário (não desloga ao fechar a aba/janela do navegador dentro da jornada de trabalho), enquanto impõe segurança bancária com detecção de inatividade de 10 minutos (aviso aos 9m30s com botão "Continuar Logado") e encerramento forçado da sessão após 12 horas de jornada para exigir novo login no dia seguinte.
- **Público-alvo:** Operadores, traders de exportação, despachantes e administradores que utilizam o sistema ao longo do dia comercial.
- **Valor Principal:** Elimina perda acidental de trabalho por fechamento de aba, previne telas abertas sem supervisão em ambientes compartilhados e garante conformidade de auditoria com corte absoluto a cada 12 horas.

---

### 2. User Experience & Visual Design

#### A. Fluxos Principais
1. **Login e Fixação do Prazo Absoluto (0h às 12h):**
   - No login bem-sucedido, o servidor e o cliente gravam o timestamp `auth_created_at` e configuram cookies seguros com `Max-Age: 43200` (12 horas).
2. **Navegação Diária e Renovação Silenciosa:**
   - Enquanto o usuário interage (cliques, digitação, navegação), um heartbeat em segundo plano renova o token de acesso de curta duração (sliding window), respeitando sempre o teto absoluto das 12h.
3. **Alerta de Ociosidade (Faltando 30s para 10 min):**
   - Aos 9 minutos e 30 segundos sem atividade do mouse/teclado, surge um modal flutuante com backdrop escuro sutil:
     - Título: *"Sua sessão expira em breve por falta de atividade"*
     - Indicador com anel ou badge com contagem regressiva em segundos (`30s`, `29s`, `...`)
     - Botão de ação primária: `[Continuar Logado]`, que ao ser clicado reseta o timer de 10 min, aciona renovação silenciosa e mantém o usuário exatamente onde estava.
4. **Término dos 30s sem Ação:**
   - Se o contador chegar a zero, a tela é bloqueada exibindo o modal de bloqueio por senha já estilizado (com a marca PEX Export Intelligence e senha master ou de perfil).
5. **Expiração do Limite Absoluto (Dia Seguinte / 12h decorridas):**
   - Ao abrir a aba no dia seguinte ou ultrapassar 12 horas do login inicial, o sistema detecta que o prazo de 12 horas expirou, limpa `localStorage` e cookies, e redireciona para `/login?reason=session_expired` exibindo mensagem informativa clara.

#### B. Identidade Visual do Modal de Alerta
- **Paleta:** Fundo escuro profundo (`slate-950/80` com `backdrop-blur-md`), card centralizado em `slate-900` com borda fina em `slate-800` e acento verde esmeralda (`emerald-500`).
- **Contagem Regressiva:** Tipografia tabular destacada (`font-mono text-2xl font-black text-amber-400 tabular-nums`), transmitindo urgência controlada sem poluição visual.
- **Botão de Ação:** `Continuar Logado` com estilo primário verde esmeralda PEX (`bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg transition-all`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Cookie Persistente vs Session Cookie (Memória)**
  - *Abordagem:* Cookies configurados com `Max-Age: 43200` (12 horas), `SameSite=None`, `Secure`, permitindo que o usuário feche e reabra o navegador ou troque de abas sem perder a sessão durante o expediente.
  - *Por quê:* Cookies puramente de sessão (`Session`) são destruídos ao fechar todas as abas no navegador, gerando frustração em jornadas de trabalho ativas. Com `Max-Age` de 12 horas fixas, resolvemos a persistência sem violar a segurança diária.

- **Decisão 2: Teto Absoluto Inflexível de 12 Horas (Zero Extensão Infinita)**
  - *Abordagem:* O backend e o middleware gravam o carimbo `auth_created_at`. O endpoint de refresh silencioso rejeita qualquer renovação se `now - auth_created_at >= 12h`.
  - *Por quê:* Evita sessões zumbis que ficariam ativas eternamente caso houvesse um monitor ou script simulando toques. Garante que todo colaborador seja autenticado pelo menos uma vez ao dia.

- **Decisão 3: Integração do Alerta de Ociosidade no `SecurityShield`**
  - *Abordagem:* Estender o `SecurityShield.tsx` para gerenciar dois estágios temporais: Alerta (9m30s) e Bloqueio (10m00s), mantendo a exceção do Backoffice Cockpit já consolidada.
  - *Por quê:* Centraliza toda a governança de proteção de tela, anti-inspeção e inatividade em um único guardião já montado no layout global da aplicação.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CICLO DE VIDA DA SESSÃO                         │
└────────────────────────────────────────────────────────────────────────┘

    [ Login Sucesso ] ──▶ Injeta cookies (Max-Age: 12h)
                              │  - next-auth.session-token
                              │  - bela_session=1
                              │  - bela_auth_created_at=<timestamp>
                              ▼
    ┌────────────────────────────────────────────────────────────┐
    │           SISTEMA EM USO (Navegador Aberto / Abas)         │
    │                                                            │
    │  Atividade do Usuário ──▶ Sliding Window Heartbeat         │
    │  (mouse / teclas)         (renova token a cada 4min        │
    │                           SE timestamp < 12h)              │
    └────────────────────────────────────────────────────────────┘
                              │
               Inatividade contínua por 9m30s
                              │
                              ▼
    ┌────────────────────────────────────────────────────────────┐
    │         MODAL DE ALERTA DE OCIOSIDADE (30 SEGUNDOS)        │
    │                                                            │
    │   "Sua sessão expira em breve por falta de atividade"      │
    │                 Contagem: [ 30s ... 01s ]                  │
    │                                                            │
    │   [ Continuar Logado ] ──────▶ Reseta timer (volta aos 10m)│
    │                                Dispara refresh silencioso  │
    └────────────────────────────────────────────────────────────┘
                              │
                   Contador zera (00s)
                              │
                              ▼
    ┌────────────────────────────────────────────────────────────┐
    │                  TELA DE BLOQUEIO POR SENHA                │
    │      Exige senha master/usuário para retornar à tela       │
    └────────────────────────────────────────────────────────────┘
                              │
           Tempo total desde o login atingiu 12h
                              │
                              ▼
    ┌────────────────────────────────────────────────────────────┐
    │            EXPIRAÇÃO ABSOLUTA (DIA SEGUINTE)               │
    │  - Limpeza total de cookies e localStorage                 │
    │  - Redirecionamento automático para /login?reason=expired   │
    └────────────────────────────────────────────────────────────┘
```

#### Entidades e Componentes Afetados
1. **`src/lib/authOptions.ts`**:
   - Ajuste do `maxAge` da sessão NextAuth para `12 * 60 * 60` (43.200s).
   - Inclusão do claim `authCreatedAt` no JWT e na Session para validação estrita do teto de 12 horas.
2. **`src/app/api/auth/login/route.ts` & `src/app/api/auth/primeiro-acesso/route.ts`**:
   - Atualização do `maxAge` dos cookies `bela_session` e `bela_user_email` para 12 horas (`43200`).
   - Gravação do cookie `bela_auth_created_at` com o timestamp atual e `maxAge: 43200`.
3. **`src/app/api/auth/refresh/route.ts` (Novo Endpoint)**:
   - Endpoint de renovação silenciosa. Valida se a sessão atual ainda está dentro do período de 12 horas. Se sim, renova cookies; se passou de 12 horas, retorna HTTP 401 para forçar logoff.
4. **`src/components/security/SecurityShield.tsx`**:
   - Adição do estado de aviso de ociosidade (`isIdleWarningVisible`), timer de contagem regressiva (`warningSecondsLeft`, 30 a 0), e botão "Continuar Logado".
   - Checagem periódica do prazo absoluto (12h). Se estourado, executa logoff e redirecionamento.
5. **`src/components/navigation/DashboardShell.tsx` & `src/app/api/auth/logout/route.ts`**:
   - Garantia de limpeza completa de todos os cookies (`bela_session`, `bela_user_email`, `bela_auth_created_at`, tokens do NextAuth).
6. **`src/middleware.ts`**:
   - Validação do prazo absoluto: se a requisição carregar `bela_auth_created_at` mais antigo que 12 horas, redireciona diretamente para `/login?reason=session_expired`.

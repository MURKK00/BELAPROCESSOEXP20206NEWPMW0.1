# Plano de Implementação — Módulo Backoffice TV (Painel de Exibição Contínua)

Este plano descreve a criação do módulo **Backoffice TV**, um painel executivo de monitoramento operacional e financeiro em tempo real projetado para espelhamento contínuo em televisores do escritório da Bela Cereais.

---

## 1. Visão Geral e Decisões Confirmadas

O módulo fornecerá visibilidade instantânea dos principais indicadores de exportação em uma interface de **modo escuro de alto contraste**, sem ruído visual, com atualização automática a cada **30 segundos** e botão de **Modo TV (Tela Cheia)** que recolhe a navegação para aproveitar 100% da área do monitor.

### Resumo das Decisões de Design e UX:
- **Estilo Visual**: Modo escuro de alto contraste (`#070B14` e `#0F172A`) com números tabulares em tipografia mono (`tabular-nums font-mono`) legíveis à distância.
- **Modo Tela Cheia (TV Wallboard)**: Botão no cabeçalho para expandir para tela cheia nativa (`Fullscreen API`) e ocultar elementos colaterais de navegação.
- **Atualização em Tempo Real**: Polling suave a cada 30 segundos com barra de pulsação discreta indicando funcionamento ativo.
- **Acesso Dedicado / Perfil TV**: Configuração na matriz de perfis e permissões para permitir usuários com visualização exclusiva de TV.

---

## 2. Arquitetura do Painel e Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKOFFICE TV WALLBOARD                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. BARRA SUPERIOR: Relógios Mundiais com Bandeiras                     │
│    🇧🇷 Santos/Sinop  🇺🇸 Chicago  🇦🇪 Dubai  🇧🇩 Dhaka  🇨🇳 Dalian/Xangai  │
├────────────────────────────────────────────────────────────────────────┤
│ 2. FAIXA DE CÂMBIO & MARGEM AO VIVO                                    │
│    Dólar Comercial (PTAX) │ Dólar Spot Live │ Margem Cambial Estimada  │
├────────────────────────────────────────────────────────────────────────┤
│ 3. CARDS DE IMPACTO OPERACIONAL (KPIs)                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐ │
│  │ PRÓXIMO DEADLINE │ │  NEGOCIAÇÕES EM  │ │  NOTAS SEM AVERBAÇÃO   │ │
│  │    DE EMBARQUE   │ │     EXECUÇÃO     │ │   Total s/ averbação    │ │
│  │ Navio / Porto    │ │  Volume Total kg │ │  ⚠ Carga já embarcada  │ │
│  │ Regressiva 2d 4h │ │  Contêineres     │ │     (Risco Fiscal)     │ │
│  └──────────────────┘ └──────────────────┘ └─────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ 4. LISTA DE NEGOCIAÇÕES EM AUTO-SCROLL (PARTE INFERIOR)                │
│    Rolagem lenta e contínua em loop com Contrato, Cliente, Volume,     │
│    Status Operacional, Navio e Contêineres Estufados                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Especificação das Mudanças

### A. Navegação Lateral e Permissões
1. **`src/components/Sidebar.tsx`**:
   - Adicionar o item **"Backoffice"** logo abaixo de **"Cotações Mercado"** e antes de **"Painel Admin"**.
   - Ícone representativo (`Tv2` ou `MonitorPlay` do `lucide-react`) com badge `TV 4K` ou `WALLBOARD`.
2. **`src/lib/permissions.ts`**:
   - Criar permissão/helper `canAccessBackoffice(user)` e suporte ao perfil `BACKOFFICE_TV` para restringir ou liberar contas dedicadas de TV.

### B. Endpoint de Telemetria Consolidada (`/api/backoffice/metrics`)
1. **`src/app/api/backoffice/metrics/route.ts`**:
   - Retorna payload único otimizado para TV:
     - **Próximo Deadline**: busca negociações ativas com menor `deadlineEmbarque` ou `deadlineCarga`, calculando tempo restante.
     - **Contagem por Status**: negociações em execução (`EM_EXECUCAO`, `EM_NEGOCIACAO`), embarcadas (`EMBARCADO`, `FINALIZADO`), volume consolidado.
     - **Auditoria Fiscal Crítica**:
       - Total de NFs de exportação (Etapa 4) com `statusAverbacao !== 'AVERBADA'`.
       - Quantidade crítica: NFs sem averbação cujo processo pai já tem status `EMBARCADO`.
     - **Cotações e Câmbio**: Dólar comercial, PTAX oficial, variação diária e spread/margem de segurança.
     - **Lista Completa de Processos**: com progresso de checklist e contêineres para o ticker inferior.

### C. Página Principal do Backoffice TV (`/src/app/(dashboard)/backoffice/page.tsx`)
1. **Header do Painel**:
   - Identificação corporativa "Bela Cereais | Backoffice Cockpit TV".
   - Status de conexão ao vivo com indicador de auto-refresh de 30s.
   - Botão **Modo TV (Expandir)** para ocultar cabeçalhos e ativar tela cheia.
2. **Faixa de Relógios Mundiais**:
   - Horários sincronizados para centros chave: Brasil (GMT-3), Estados Unidos/CBOT (GMT-5), Emirados Árabes (GMT+4), Bangladesh (GMT+6) e China (GMT+8).
3. **Bloco de Câmbio & Margem Dólar**:
   - Cotação Spot, PTAX oficial do Banco Central, Spread operacional da trading.
4. **Cards de Acompanhamento Operacional**:
   - **Próximo Deadline**: Destaque com alerta visual âmbar/vermelho se estiver a menos de 48h.
   - **Em Execução vs. Embarcadas**: Métricas consolidadas de sacas, toneladas e contêineres.
   - **Alerta de Averbação SEFAZ**: Alerta visual das NFs de exportação pendentes e embarcadas.
5. **Ticker / Carrossel Inferior com Rolagem Automática (Auto-Scroll)**:
   - Lista animada suavemente (CSS keyframe ou animação controlada por intervalo) exibindo os processos em andamento.
   - Pausa sob interação do mouse e retoma automaticamente para a TV.

---

## 4. Plano de Verificação e Testes

- [ ] **Compilação e Tipagem**: Executar `compile_applet` para garantir que todas as rotas e tipos TypeScript compilam sem erro.
- [ ] **Validação de ESLint**: Executar `lint_applet` para certificar ausência de advertências ou dependências faltantes em hooks.
- [ ] **Comportamento TV**:
  - Testar botão de tela cheia e retração de navegação.
  - Verificar temporizador de 30 segundos e atualização de dados sem recarregar a página.
  - Testar loop suave do auto-scroll na parte inferior.

# Revisão de produto, arquitetura e custos

> Estado analisado: 12 de agosto de 2026

## Resumo executivo

A aplicação continua como PWA web-first e é agora distribuída no Android através de
uma Trusted Web Activity (TWA) gerada por Bubblewrap. Esta solução preserva o mesmo
origin, Firebase Auth, Firestore, notificações web e route handlers Next.js sem
duplicar UI, regras de negócio, testes ou manutenção num cliente nativo.

Se widgets de ecrã inicial se mantiverem prioritários, continuam a exigir um piloto
nativo separado; a TWA não transforma APIs web em widgets Android. Capacitor ou um
módulo Kotlin só devem ser avaliados para essa capacidade concreta. Geofencing em
background continua não recomendado devido a permissões sensíveis, consumo de
bateria e política da Play Store.

As prioridades devem ser confiabilidade, privacidade, importação bancária local,
tratamento uniforme de erros e experiência das funcionalidades domésticas. Temas,
avatar e gamificação ficam depois do núcleo.

## Estado do produto

### Pontos fortes

- PWA instalável e responsiva, com uma única base de código.
- Dados isolados por casa em Firestore e sincronização em tempo real.
- Autenticação Firebase, notificações FCM e agendamento externo idempotente.
- Importação bancária local, sem IA nem envio de documentos.
- CI com TypeScript, ESLint, testes e build em cada PR.
- Shell Android TWA com deep links, delegação de notificações e APK de teste em CI.
- Funcionalidades domésticas integradas: compras, tarefas, projetos, hábitos,
  finanças, calendário, eventos e meteorologia.

### Riscos e inconsistências

1. Alguns componentes de funcionalidade concentram UI, estado, validação e acesso a
   Firestore, tornando alterações e testes mais difíceis.
2. As mutações Firestore não expõem um resultado e erro uniformes em todas as áreas;
   algumas interfaces podem fechar mesmo quando uma operação falha.
3. Categorias e regras semelhantes aparecem em mais de um módulo, com risco de
   divergência entre criação manual, importação e apresentação.
4. O backlog favorecia muitas variantes cosméticas e mecânicas RPG antes de concluir
   confiabilidade e funcionalidades domésticas.
5. Ideias de geração com LLM introduziam custo, dependência de rede e processamento
   externo desnecessários.
6. Serviços gratuitos têm limites que precisam de ser documentados e observados.

## Direção de arquitetura

### Agora

- Manter Next.js/React, Firebase e a arquitetura PWA.
- Separar progressivamente cada domínio em:
  - tipos e validação;
  - cálculos e regras puras;
  - repositório Firestore;
  - hooks de aplicação;
  - componentes de apresentação.
- Definir um resultado comum para mutações, por exemplo
  `{ ok: true, value } | { ok: false, error }`, e não fechar formulários após falha.
- Centralizar categorias, datas, montantes e normalização em módulos de domínio.
- Adicionar validação em runtime na fronteira Firestore/importação.
- Testar regras puras e fluxos críticos; reservar testes de componentes para
  interação e acessibilidade.
- Manter documentos financeiros exclusivamente no dispositivo.

### Mais tarde

- Extrair módulos por domínio sem uma migração total:
  `features/finance`, `features/habits`, `features/tasks`, etc.
- Introduzir Capacitor ou Kotlin apenas através de um piloto isolado se uma
  capacidade nativa aprovada, como um widget, o justificar.
- Evitar uma segunda implementação completa em Kotlin.

## Android: decisão e custo

### Decisão

Publicar a aplicação web existente como TWA e não fazer uma aplicação Android
nativa de raiz. Bubblewrap gera um projeto Android pequeno que abre o origin de
produção no browser do dispositivo. Digital Asset Links comprovam a associação
entre o pacote assinado e o site; sem essa associação, a app usa uma Custom Tab
segura com barra do browser.

Capacitor fica reservado para um futuro piloto de capacidades que a TWA não cobre,
como widgets. Não existe autorização automática para adicionar plugins, código
Kotlin, permissões sensíveis ou geofencing.

### Estimativa de esforço

| Opção | Custo externo obrigatório | Esforço próprio estimado | Resultado |
|---|---:|---:|---|
| PWA + shell TWA | €0 incremental | implementado; manutenção normal | uma base web com APK Android, deep links e push |
| APK de teste em CI | €0 | implementado | artefacto debug instalável em cada alteração Android |
| Publicação Play básica | US$25 uma vez | 1–3 dias após conta/chaves | assinatura, Digital Asset Links, QA e faixa interna |
| Widget Android | incluído acima | +1–3 semanas | piloto nativo/Capacitor com sincronização e abertura da tab correta |
| Geofencing | incluído acima | +1–3 semanas e revisão de política | lembrete de localização em background |

As estimativas são de engenharia, não orçamentos comerciais. Trabalho contratado
deve ser calculado multiplicando as horas acordadas pela taxa do fornecedor.

A Play Console cobra atualmente US$25 uma vez e contas pessoais têm requisitos de
teste/verificação. Widgets são uma API Android nativa. Geofencing requer localização
em background, que deve ser essencial para a função principal e está sujeito a
limitações e revisão de política.

Fontes:

- [Trusted Web Activities](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
- [Capacitor](https://capacitorjs.com/docs/), apenas para um futuro piloto nativo
- [Registo na Google Play Console](https://support.google.com/googleplay/android-developer/answer/6112435)
- [Android App Widgets](https://developer.android.com/develop/ui/views/appwidgets/overview)
- [Localização em background](https://developer.android.com/develop/sensors-and-location/location/background)
- [Geofencing Android](https://developer.android.com/develop/sensors-and-location/location/geofencing)

## Serviços, limites e alternativas

| Necessidade | Serviço atual | Limite/custo relevante | Decisão e alternativa |
|---|---|---|---|
| Base de dados e auth | Firebase Spark | Firestore: 50k leituras, 20k escritas e 20k eliminações/dia; 1 GiB; FCM sem custo | manter; reduzir listeners duplicados, medir utilização e exportar dados |
| Hosting | Vercel Hobby | gratuito com limites e uso não comercial/pessoal conforme o plano | manter enquanto elegível; alternativa: Firebase Hosting ou Cloudflare Pages após validar compatibilidade Next |
| Agendamento | GitHub Actions | grátis em repositórios públicos; minutos incluídos em privados | manter o workflow idempotente; alternativa: runner próprio ou cron-job.org sem dados sensíveis |
| Meteorologia | Open-Meteo free | não comercial, 10k chamadas/dia, sem garantia de uptime, atribuição necessária | manter com cache e fallback; para uso comercial avaliar self-host/dados IPMA ou plano comercial |
| Push | Firebase Cloud Messaging | sem custo | manter; limpar tokens inválidos e observar entregas |
| Geração de conteúdo | nenhuma API de IA | APIs de LLM acrescentariam custo, rede e exposição de texto | usar templates locais, regras determinísticas e edição pelo utilizador |
| PDFs bancários | pdfjs no browser | processamento local; custo de CPU/memória do dispositivo | manter; parsers por banco, sem OCR remoto e sem upload |

Fontes:

- [Preços Firebase](https://firebase.google.com/pricing)
- [Vercel pricing](https://vercel.com/pricing)
- [GitHub Actions billing](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Open-Meteo pricing](https://open-meteo.com/en/pricing)

## Roadmap recomendado

### P0 — confiabilidade, privacidade e custos

1. Arquitetura de domínio e resultados uniformes para mutações.
2. Parsers bancários locais e fixtures anonimizadas.
3. Guardrails de quotas, cache e documentação operacional.
4. Resolver falhas visíveis antes de expandir gamificação.

### P1 — valor doméstico

1. Rever o fluxo de Coisinhas e acessibilidade móvel.
2. Heatmap de hábitos com dados já existentes.
3. Countdown de eventos sem timers excessivos.
4. Lembretes recorrentes de manutenção reutilizando notificações e histórico.

### P2 — experiência e personalização

1. Skins de avatar sem reintroduzir tabs rejeitadas.
2. Sistema de temas por CSS variables, contraste e `prefers-reduced-motion`.
3. Gamificação cooperativa; não bloquear funções essenciais através de stats.

### P3 — distribuição Android e capacidade nativa condicionada

1. Testar o APK TWA na faixa interna da Play com autenticação, notificações, deep
   links e atualização do origin web.
2. Validar procura real por widget Android.
3. Fazer um piloto Capacitor/Kotlin apenas para o widget, sem geofencing.
4. Reavaliar geofencing separadamente; por omissão, não pedir localização em
   background.

## Política de backlog

Uma issue acionável deve incluir problema, resultado esperado, âmbito, fora de
âmbito, dependências, critérios de aceitação e estratégia de testes. Epics guardam
opções e fases; não é necessário manter uma issue por variante visual ou por cada
ideia de mecânica.

Decisões desta revisão:

- consolidar variantes de temas no epic de temas;
- consolidar mecânicas RPG no epic de gamificação;
- encerrar tabs de roupa rejeitadas;
- substituir geração por IA por sugestões locais;
- marcar o cron externo como concluído;
- manter widgets bloqueados por um piloto nativo separado da TWA;
- manter parsers bancários como prioridade de privacidade;
- criar trabalho explícito para arquitetura e controlo de quotas.

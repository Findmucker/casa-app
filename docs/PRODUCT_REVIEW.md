# Revisão de produto, arquitetura e custos

> Estado analisado: 14 de julho de 2026

## Resumo executivo

A aplicação deve continuar como PWA web-first. Uma reescrita completa em Android
nativo duplicaria UI, regras de negócio, testes e manutenção sem benefício para as
funcionalidades atuais.

Se widgets de ecrã inicial se mantiverem prioritários, a evolução recomendada é um
piloto com Capacitor: reutilizar a aplicação React/Next existente dentro de um
contentor Android e escrever apenas as integrações que precisam do SDK nativo.
Geofencing em background não é recomendado nesta fase devido a permissões
sensíveis, consumo de bateria e política da Play Store.

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
- Introduzir Capacitor apenas através de um piloto isolado se uma capacidade nativa
  aprovada o justificar.
- Evitar uma segunda implementação completa em Kotlin.

## Android: decisão e custo

### Decisão

Não fazer agora uma aplicação Android nativa de raiz.

Capacitor é um runtime web-native open source que permite manter a base web e aceder
a APIs Android através de plugins ou código Kotlin pontual. É a opção indicada para
um piloto, não uma autorização automática para publicar ou adicionar permissões.

### Estimativa de esforço

| Opção | Custo externo obrigatório | Esforço próprio estimado | Resultado |
|---|---:|---:|---|
| Continuar PWA | €0 incremental | manutenção normal | cobre as funcionalidades atuais |
| Piloto Capacitor interno | €0 sem publicação | 3–7 dias | build Android, autenticação, navegação e smoke tests |
| Publicação Android básica | US$25 uma vez | 2–4 semanas | shell estável, ícones, deep links, permissões, QA e Play Console |
| Widget Android | incluído acima | +1–3 semanas | widget nativo com sincronização e abertura da tab correta |
| Geofencing | incluído acima | +1–3 semanas e revisão de política | lembrete de localização em background |

As estimativas são de engenharia, não orçamentos comerciais. Trabalho contratado
deve ser calculado multiplicando as horas acordadas pela taxa do fornecedor.

A Play Console cobra atualmente US$25 uma vez e contas pessoais têm requisitos de
teste/verificação. Widgets são uma API Android nativa. Geofencing requer localização
em background, que deve ser essencial para a função principal e está sujeito a
limitações e revisão de política.

Fontes:

- [Capacitor](https://capacitorjs.com/docs/)
- [Capacitor para Android](https://capacitorjs.com/docs/android)
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

### P3 — capacidade nativa condicionada

1. Validar procura real por widget Android.
2. Fazer um piloto Capacitor sem geofencing.
3. Só publicar depois de testes de autenticação, notificações, offline, deep links e
   atualização.
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
- manter widgets bloqueados pelo piloto Android;
- manter parsers bancários como prioridade de privacidade;
- criar trabalho explícito para arquitetura e controlo de quotas.

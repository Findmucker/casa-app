# Revisão de produto, arquitetura e custos

> Estado analisado: 13 de agosto de 2026

## Resumo executivo

O produto tem dois clientes dedicados sobre os mesmos dados: uma PWA Next.js para a
web e uma aplicação Android nativa em Kotlin/Jetpack Compose. A opção anterior de
empacotar a web como Trusted Web Activity foi removida porque abria o browser do
dispositivo e não cumpria a experiência Android pretendida.

O cliente Android autentica e lê/escreve diretamente no Firebase. A navegação nativa
mantém as nove tabs do produto, o cabeçalho compacto e as superfícies globais. Os
domínios principais — listas, hábitos, finanças, calendário, eventos, meteorologia,
casa, pesquisa e perfil — usam o mesmo esquema Firestore da web.

## Princípios de produto

- A experiência Android normal nunca depende de Chrome, Brave, Custom Tabs ou WebView.
- Web e Android partilham identidade, casa, regras de segurança e contratos de dados.
- A implementação da UI é nativa, mas a identidade visual, ordem, nomes, emojis e
  hierarquia de informação são um contrato de produto entre os dois clientes.
- Alterações de esquema são contratos entre clientes e precisam de migração compatível.
- Funcionalidades essenciais precedem mecânicas experimentais de progressão.
- XP, níveis, títulos progressivos e recompensas automáticas por pontos permanecem
  desativados até existir um desenho de produto validado para essa experiência.
- Documentos financeiros continuam a ser processados localmente e nunca são enviados
  para serviços de IA.

## Estado atual

### Implementado

- PWA responsiva com o conjunto completo de funcionalidades domésticas.
- Cliente Android nativo API 23+ com Compose e Material 3.
- Firebase Auth nativo por email/password e Google Credential Manager.
- Onboarding de casa compatível com os convites existentes.
- Nove tabs nativas na mesma ordem: Início, Compras, Coisinhas, Projetos, Rotinas,
  Finanças, Calendário, Eventos e Tempo.
- Sincronização Firestore em tempo real das listas, hábitos, finanças, eventos,
  amigos, atividade do perfil, avatar e inventário.
- Pesquisa, menu da casa, perfil, histórico, convites, membros, amigos, mensagens e
  ajuda dentro do processo Android.
- Identidade visual Casinha restaurada para a experiência nativa: layout compacto,
  paleta rosa/roxo clara, cartões translúcidos e navegação original.
- FCM nativo, canais de notificação, routing para a tab correta e lembretes locais de
  hábitos que consultam o estado partilhado antes de alertar.
- Perfil sem XP ou níveis, mantendo estatísticas de atividade, conquistas por ações,
  avatar e equipamento cosmético já adquirido.
- APK debug testado por Gradle e disponibilizado no GitHub Actions.
- Verificação automática que impede regressões para TWA/browser/WebView.

### Evolução posterior à paridade base

1. Links de aplicação verificados para convites e eventos partilhados.
2. Distribuição pela faixa interna do Google Play e assinatura de produção.
3. Testes instrumentados de screenshot e notificações nos dispositivos suportados.
4. Qualquer proposta futura de progressão deve começar por investigação, regras,
   propósito e testes de produto; não por reativar os campos históricos existentes.

Cada domínio deve ter modelos, repositório, ViewModel, estados de erro/vazio e testes
próprios. Paridade não significa copiar a estrutura de componentes React; significa
preservar a experiência reconhecível, o comportamento e os dados com padrões Android.

## Custos e operação

| Necessidade | Serviço | Impacto |
|---|---|---|
| Base de dados e autenticação | Firebase | mantém o plano e quotas existentes; listeners Android também contam como leituras |
| Web e APIs | Vercel | sem alteração provocada pelo cliente nativo |
| Build Android | GitHub Actions | usa minutos de CI e guarda APK debug por 14 dias |
| Distribuição pública | Google Play | requer conta, assinatura, políticas e testes internos |
| Google login | Firebase/Google Identity | sem browser; requer package ID e certificados Android registados |
| Push nativo | Firebase Cloud Messaging | sem custo de envio; exige monitorização e QA Android por fabricante |

Referências oficiais:

- [Arquitetura recomendada Android](https://developer.android.com/topic/architecture)
- [Jetpack Compose](https://developer.android.com/compose)
- [Firebase Authentication Android](https://firebase.google.com/docs/auth/android/start)
- [Firebase pricing](https://firebase.google.com/pricing)
- [Google Play app signing](https://developer.android.com/studio/publish/app-signing)

## Política de entrega

Toda alteração Android deve nascer numa issue com resultado e critérios de aceitação,
seguir num commit focado, passar `android:verify`, testes, lint e build, e ser testada
num dispositivo real antes de fechar a issue. Binários, SDKs, keystores e segredos não
são versionados.

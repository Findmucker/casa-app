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

### Preparado, mas ainda não ativado

O workflow Android inclui um canal beta privado pelo Firebase App Distribution. A
beta é não-debuggable, mantém o package `com.findmucker.casa`, usa uma assinatura
estável e recebe `versionCode` monotónico no intervalo `100000+`. Antes do upload, a
CI valida package, versão, modo de build e certificado. A entrega destina-se apenas ao
grupo Firebase `casinha-testers`; identidades e endereços dos testers não são
versionados.

O rollout ainda aguarda a autorização do repositório no Workload Identity Federation
e o primeiro teste completo nos dois dispositivos. Até lá, a variável
`ANDROID_DISTRIBUTION_ENABLED` do environment `android-testers` permanece `false` e
o job termina com skip explícito, conservando o APK debug verificado. WIF troca o
token OIDC do GitHub por credenciais temporárias, sem guardar uma chave JSON de
service account ou um token Firebase de longa duração.

Depois da ativação, alterações Android relevantes enviadas para `master` distribuem
a beta automaticamente; também é possível iniciar manualmente o workflow em
`master`, escolhendo `distribute`. Pull requests nunca são distribuídos. O Firebase
envia o convite inicial e um email por build, mas cada tester continua a descarregar
pelo Firebase App Tester e a confirmar a instalação Android. É um beta estável e
privado por Wi-Fi, não uma atualização automática de loja.

A primeira passagem de uma APK antiga, assinada com outro certificado, exige uma
desinstalação. Depois dessa migração única, a assinatura e a sequência de versões
estáveis permitem instalar as betas seguintes por cima. A cópia recuperável da chave
fica apenas na máquina de manutenção, dentro de `.local-signing/` ignorado pelo Git,
e a JKS codificada e as três credenciais de acesso usadas pela CI ficam nos secrets
protegidos do environment. Apenas o fingerprint SHA-256 público do certificado é
versionado, em `android/CASINHA_BETA_CERT_SHA256`, para a CI poder auditar o signer.

### Evolução posterior à paridade base

1. Links de aplicação verificados para convites e eventos partilhados.
2. Distribuição pela faixa interna do Google Play e assinatura de produção, para
   instalação pela loja e atualizações automáticas reais depois de validar a beta
   privada.
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
| Beta Android privada | Firebase App Distribution | entrega APK assinada ao grupo fechado; gera convite inicial, notificação por release e confirmação de instalação |
| Distribuição pública | Google Play | requer conta, assinatura, políticas e testes internos |
| Google login | Firebase/Google Identity | sem browser; requer package ID e certificados Android registados |
| Push nativo | Firebase Cloud Messaging | sem custo de envio; exige monitorização e QA Android por fabricante |

Referências oficiais:

- [Arquitetura recomendada Android](https://developer.android.com/topic/architecture)
- [Jetpack Compose](https://developer.android.com/compose)
- [Firebase Authentication Android](https://firebase.google.com/docs/auth/android/start)
- [Firebase App Distribution para Android](https://firebase.google.com/docs/app-distribution/android/distribute-cli)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
- [Firebase pricing](https://firebase.google.com/pricing)
- [Google Play app signing](https://developer.android.com/studio/publish/app-signing)

## Política de entrega

Toda alteração Android deve nascer numa issue com resultado e critérios de aceitação,
seguir num commit focado, passar `android:verify`, testes, lint e build, e ser testada
num dispositivo real antes de fechar a issue. Binários, SDKs, keystores e segredos não
são versionados. Uma entrega beta só pode partir de `master`, usar a assinatura
estável e o intervalo reservado de `versionCode`, e ser confirmada nos dois
dispositivos. Emails de testers pertencem ao grupo Firebase, nunca ao workflow ou à
documentação.

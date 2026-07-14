# A Nossa Casinha - Manual do Utilizador

> Última atualização: 14 de julho de 2026 | Deploy contínuo

## O que e a app?

A Nossa Casinha e uma app de gestao domestica para casais e familias. Permite organizar compras, tarefas, habitos, financas, eventos e muito mais — tudo partilhado entre os membros da casa, com notificacoes push reais e um sistema de gamificacao RPG completo.

Todos os membros da casa sao **iguais** — nao ha hierarquia de administrador.

---

## Navegacao

A app tem uma **barra de tabs** na parte inferior com 9 seccoes. Podes navegar por:
- **Tap** na tab desejada
- **Swipe** horizontal para avancar/recuar entre tabs
- **Menu central** (tap no nome da casa no header) para ver todas as opcoes
- **Botao voltar** (dispositivo/browser) — fecha o painel aberto em vez de sair da app

### Tabs disponiveis

| Emoji | Nome | Funcao |
|-------|------|--------|
| ✨ | Inicio | Dashboard com resumo semanal |
| 🛒 | Compras | Lista de compras partilhada |
| 🧹 | Coisinhas | Pequenas tarefas/prioridades |
| 🔧 | Projetos | Projetos maiores da casa |
| 🧘 | Rotinas | Habitos diarios com streaks e filtros |
| 💰 | Finanças | Despesas, rendimentos, poupancas |
| 📅 | Calendário | Calendario mensal integrado |
| 🎉 | Eventos | Eventos e planos partilhados |
| 🌤️ | Tempo | Previsao meteorologica 7 dias |

---

## Dashboard (Inicio)

O ecra inicial mostra:
- **Progresso semanal** — percentagem de tarefas feitas esta semana
- **Alertas urgentes** — comprinhas marcadas como urgentes
- **Habitos de hoje** — quantos habitos ja fizeste hoje + streak
- **Cards resumo** — comprinhas pendentes, coisinhas, projetos em progresso, gastos do mes

---

## Compras (Lista de Compras)

- Adiciona items com o campo de texto no topo
- Marca como **urgente** para destacar no topo
- Items sao agrupados por **categoria** automaticamente (Frescos, Carnes, Frutas, Padaria, Despensa, Bebidas, Snacks, Higiene, Pets)
- Tap num item para marcar como comprado (com animacao de celebracao)
- Categorias colapsaveis com barra de progresso por seccao
- Atribui a pessoa responsavel (qualquer membro da casa)
- Preco estimado opcional
- Ordenado por fluxo de supermercado

---

## Coisinhas (Prioridades)

- Pequenas tarefas do dia-a-dia (Casa, Cozinha, Decoracao, Organizacao, Bricolage, WC, Tech, Jardim, Roupa, Tarefazinhas)
- Auto-categorizacao automatica ao adicionar
- Categorias em caixas colapsaveis com barra de progresso
- Arrasta para reordenar por prioridade
- Atribui a pessoa responsavel + notas em cada item
- Autocomplete com sugestoes baseadas em items anteriores
- Animacao de celebracao ao completar uma categoria inteira

---

## Projetos

- Projetos maiores (obras, compras grandes, reparacoes)
- Estados: **pendente** → **a fazer** → **concluido**
- Auto-categorizacao (Pintura, Obras, Portas/Janelas, Eletricidade, Reparacoes, Canalizacao, Cozinha, Exterior, Aquecimento)
- Categorias colapsaveis com contadores de estado
- Cada projeto pode ter subtarefas, notas e orcamento

---

## Rotinas (Habitos)

- Cria habitos diarios (ex: tomar vitaminas, exercicio, medicacao)
- Marca cada dia como feito com check diario (reseta a meia-noite)
- Sistema de **streaks** — dias consecutivos com animacao 🔥
- Hora configuravel por habito (para lembretes)
- **Selector de dias da semana** — define em que dias o habito esta ativo
- **Filtro por pessoa** — filtra habitos por membro da casa (Todos / nome individual)
- **Atribui a pessoa** responsavel (dinamico por membros da casa)
- **Notificações fiáveis** — o servidor recupera execuções atrasadas e impede envios duplicados para a mesma rotina e pessoa
- **Push notifications reais** — recebe lembretes mesmo com a app fechada (via FCM)
- Pontos de gamificacao por cada check (+2 pontos)

---

## Finanças

A tab Finanças esta organizada em **3 sub-tabs** para gestao financeira completa:

### Sub-tab: Despesas
- Regista gastos com nome, valor, categoria e quem pagou
- Aceita apenas valores positivos
- Resumo mensal por categoria e por membro
- Navegacao por meses (setas para avancar/recuar), no idioma selecionado

### Sub-tab: Rendimentos
- Regista entradas de dinheiro (salario, freelance, outros)
- Aceita apenas valores positivos
- Associa a um membro da casa
- Historico mensal de rendimentos

### Sub-tab: Poupancas
- Define **objetivos de poupanca** (ex: ferias, carro, fundo de emergencia)
- Cada objetivo tem um valor alvo e valor atual
- **Barras de progresso** visuais para acompanhar cada objetivo
- Adiciona contribuicoes positivas ao longo do tempo

### Graficos Visuais
Na seccao de despesas, tens acesso a graficos SVG responsivos e acessiveis:
- **Donut chart** — distribuicao de gastos por categoria, mesmo quando existe uma unica categoria
- **Bar chart** — despesas e rendimentos dos ultimos 6 meses; meses sem movimentos ficam vazios
- **Split rings** — visualizacao da divisao de gastos entre membros da casa

Os graficos atualizam automaticamente com o mes selecionado, ignoram valores invalidos e usam o idioma ativo nos meses e montantes.

---

## Calendário

- Vista mensal com grid interativo
- **Emojis** por tipo de atividade no dia (substituiram os dots coloridos):
  - ✅ Habitos completados
  - 🏠 Projetos concluidos
  - 🎉 Eventos agendados
  - 🇵🇹 Feriados portugueses
  - 🎂 Aniversarios dos membros (com MiniAvatar pixel art)
- **Feriados portugueses** automaticos (fixos + moveis como Pascoa e Carnaval)
- **Aniversarios** — datas de nascimento dos membros aparecem com o avatar no grid
- **Previsao meteorologica** — emoji do tempo nos proximos 7 dias diretamente no grid
- Tap num dia para ver todos os detalhes:
  - Card de meteo com temperatura min/max e probabilidade de chuva
  - Lista de eventos, habitos e projetos desse dia
  - Aniversarios com MiniAvatar do membro
  - Feriados e datas especiais

---

## Eventos

- Cria eventos com titulo, data e numero de participantes
- Lista de compras e tarefas especificas por evento
- Atribui responsaveis a cada item do evento
- **Previsao meteo automatica** para eventos nos proximos 7 dias
- **Partilha com amigos** via link publico:
  - Amigos registam-se com nome
  - Veem detalhes do evento e podem juntar-se
  - Confirmacao antes de participar
- Historico de eventos passados com opcao de clonar
- **Integrado no Calendário** — eventos aparecem com emoji 🎉

---

## Tempo (Meteorologia)

A previsão usa a localização atual do dispositivo quando autorizada. Se a permissão
for recusada ou a geolocalização não estiver disponível, a aplicação mostra
explicitamente `Óbidos (predefinição)`.

- Previsao a 7 dias via Open-Meteo API (gratuita)
- Temperatura, vento, precipitacao
- Vista horaria expandivel por dia (tap para expandir)
- **Integrada no Calendário** — emoji do tempo visivel no grid
- **Integrada nos Eventos** — previsao automatica para eventos proximos

---

## Notificacoes Push

A app suporta **notificacoes push reais** via Firebase Cloud Messaging (FCM):

### Ativar notificacoes
1. Vai a tab **Rotinas**
2. Toca no botao 🔔 no topo
3. Aceita a permissao do browser
4. Pronto! Recebes notificacoes mesmo com a app fechada

### Verificar estado das notificacoes
- Menu central → **❓ Ajuda** — mostra se as notificacoes estao ativas, o estado da permissao e informacao de debug

### Routing inteligente
- Ao tocar numa notificacao, a app abre diretamente na **tab correta** (ex: notificacao de compras abre a tab Compras, notificacao de evento abre Eventos)

### Tipos de notificacao
- **Lembretes de hábitos** — recebe o lembrete configurado mesmo quando o scheduler se atrasa; depois de concluída, a rotina deixa de ser elegível nesse dia
- **Mensagens de membros** — recebe mensagens enviadas por outros membros da casa
- **Item urgente nas compras** — quando alguem marca um item como urgente 🔥
- **Novo evento criado** — quando alguem cria um evento na casa
- **Evento amanha** — lembrete automatico as 8h para eventos do dia seguinte
- **Aniversario hoje** — lembrete automatico as 8h quando e aniversario de um membro
- **Pedido de amizade** — quando outra casa envia um pedido de vizinhanca
- **Pedido aceite** — quando o teu pedido de vizinhanca e aceite
- **Novo membro** — quando alguem se junta a tua casa via convite

### Enviar mensagem a outro membro
1. Tap no nome da casa no header
2. Na seccao **👥 Membros**, tap no membro a quem queres enviar
3. Tap em **💌 Mensagem** (aparece para todos os membros exceto tu proprio)
4. Escolhe uma mensagem rapida ou escreve a tua
5. O outro membro recebe uma notificacao push com a tua mensagem

### Mensagens rapidas disponiveis
- ❤️ Amo-te!
- 🏠 Estou a caminho de casa
- 🛒 Vou ao supermercado, precisas de algo?
- 🍽️ O jantar esta pronto!
- 🐱 O gato precisa de comer
- ☕ Queres um cafe?
- 🧹 Ja limpei a cozinha!

---

## Tutorial

A app inclui **dicas contextuais por tab** — quando entras numa tab pela primeira vez, aparece um pequeno painel com dicas sobre essa seccao. Podes dispensar cada dica individualmente.

---

## Vizinhos (Casas Amigas)

O sistema de Vizinhos permite conectar a tua casa com outras casas na app.

### Aceder
- Menu central → seccao Casa → 🏠 Vizinhos

### Conectar casas
Existem 2 formas de adicionar casas amigas:

1. **Por codigo** — gera um codigo de 6 caracteres na tua casa e partilha com o amigo. O amigo introduz o codigo na sua app.
2. **Por pesquisa** — pesquisa casas por nome e envia um pedido de amizade.

### Funcionalidades
- Ver lista de casas amigas com **cards de avatar dos membros** (pixel art, como no widget de membros do menu)
- Aceitar/rejeitar pedidos pendentes
- Remover casas amigas
- Resultados de pesquisa mostram nomes dos membros da casa
- O **botao voltar** fecha o painel de Vizinhos (como em qualquer outro painel)

---

## Menu Central

Ao tocar no **nome da casa** no header, abre um menu organizado em seccoes:

### Navegar
Grid com todas as 9 tabs — tap para ir directamente.

### Casa
- **🔗 Convidar** — gerar codigo de convite para novos membros
- **👥 Membros** — widget com avatares de todos os membros, nivel e acoes rapidas:
  - Tap num membro para ver botoes de acao: 💌 Mensagem e 👤 Perfil
  - **💌 Mensagem** — abre diretamente o painel de mensagem para esse membro (nao aparece para ti proprio)
  - **👤 Perfil** — mostra o perfil do membro em modo leitura (sem tab de definicoes); no teu proprio perfil, abre o perfil editavel completo
  - Animacoes: entrada staggered, bounce no membro selecionado, hover scale
- **🏠 Vizinhos** — sistema de casas amigas (conectar, pesquisar, pedidos)
- **✏️ Renomear** — editar o nome da casa (visivel para todos os membros em tempo real)

### Definicoes
- **📜 Historico** — registo de items completados com data e stats
- **🌐 Idioma** — toggle inline PT 🇵🇹 / EN 🇬🇧

### Sair
Botao isolado para logout seguro.

---

## Perfil e Gamificacao

Acede ao perfil tocando no **teu avatar** (pixel art) no canto superior direito do header.

### Avatar Pixel Art
- Escolhe entre 11 animais (Panda, Gatinho, Coelhinho, Raposa, Ursinho, Caozinho, Pinguim, Hamster, Coala, Coruja, Sapinho)
- Animacoes idle unicas por animal (munch, groom, hop, sly, sleepy, excited, waddle, nibble, blink, croak)
- 6 tabs de customizacao: Animal, Olhos, Boca, Roupa Cima, Roupa Baixo, Acessorios (7 opcoes cada)
- Sombras realisticas por peso do animal
- Avatar exibido no header do perfil
- **MiniAvatar** — versao compacta do avatar pixel art, usada nos filtros de pessoa e selectores de responsavel (Rotinas, Finanças, Coisinhas)
- Se nao tiveres avatar configurado, o MiniAvatar mostra um **avatar pixel art deterministico** baseado no teu nome
- Se nao tiveres avatar NEM equipamento, o perfil mostra um **circulo com a letra inicial** do teu nome
- **Badge de capacete** — quando tens equipamento equipado, o MiniAvatar e o widget de membros mostram um pequeno badge de capacete

### Sistema RPG
- **Pontos** ganhos ao completar tarefas (+1 compra, +2 coisinha, +5 projeto, +2 habito)
- **Nivel** sobe a cada 50 pontos
- **Titulo** baseado no nivel — desde "Aprendiz da Casa" (Nv.1) ate "Divindade do Lar" (Nv.30)
- **Atributos** calculados automaticamente:
  - STR (Forca): projetos concluidos
  - INT (Inteligencia): coisinhas feitas
  - DEX (Destreza): comprinhas feitas
  - CHA (Carisma): total de tarefas
  - VIT (Vitalidade): habitos feitos
  - LCK (Sorte): melhor streak

### Badges (9 conquistaveis)
Primeiro Passo, Em Chamas, Imparavel, Lenda, Compradora, Faz-Tudo, Arquiteto, Centenario, Top Scorer.

### Equipamento (6 slots)
- 🗡️ Espada do Construtor — 3 projetinhos
- 🛡️ Escudo da Consistencia — 10 dias streak
- 👑 Coroa Real — nivel 10
- 🧤 Luvas do Faz-Tudo — 50 coisinhas
- 👟 Botas do Maratonista — 30 comprinhas
- 💍 Anel da Comunidade — 100 pontos
- O modelo do personagem mostra um **placeholder fofo** quando nao tens equipamento (em vez de uma silhueta generica)
- O equipamento e sincronizado em toda a app — ao ver o perfil de outro membro, o equipamento dele e carregado corretamente

### Loot Boxes
- Ganha 1 caixa por cada 50 pontos
- 30 items cosmeticos em 6 slots (cabeca, arma, escudo, corpo, pes, acessorio)
- 4 raridades: Comum (50%), Raro (30%), Epico (15%), Lendario (5%)
- Animacao de abertura: shake → explosao → reveal
- Duplicados convertidos em XP (Lendario: 50, Epico: 30, Raro: 15, Comum: 5)

### Inventario WoW TBC-style
- Grid com filtro por slot
- Drag-and-drop para equipar items no avatar
- **Modo leitura** — ao ver o perfil de outro membro, o inventario e visivel mas nao podes abrir loot boxes

---

## Pesquisa Global

- Toca no icone 🔍 no canto superior esquerdo
- Escreve 2+ letras para pesquisar em todas as tabs de uma vez
- Resultados agrupados por tipo (comprinhas, coisinhas, projetos, habitos, despesas)
- Tap num resultado para navegar direto para a tab correspondente

---

## Historico

- Acessivel via menu central → 📜 Historico
- Lista de todos os items completados com data
- Stats por categoria (comprinhas, coisinhas, projetos)
- Mostra os ultimos 50 items completados

---

## Membros da Casa

Todos os membros sao **iguais** — nao existe hierarquia de administrador.

O widget de Membros no menu central mostra:
- Avatar pixel art de cada membro com nivel
- Tap num membro revela botoes de acao:
  - **💌 Mensagem** — abre o painel de mensagem diretamente para esse membro (nao aparece no teu proprio)
  - **👤 Perfil** — mostra o perfil em modo leitura (sem definicoes); no teu perfil, abre o perfil editavel completo
- Animacoes suaves: entrada staggered, bounce na selecao, hover scale
- Cada membro so pode sair a si proprio (nao e possivel remover outros)

### Convidar novos membros
1. Menu central → 🔗 Convidar
2. Gera um codigo de convite
3. Partilha o link com o novo membro
4. O membro aceita e junta-se automaticamente a casa

---

## Temas Visuais

A app muda automaticamente de tema ao longo do dia:

| Periodo | Tema | Cores |
|---------|------|-------|
| 7h - 12h | ☀️ Manha | Amber, amarelo, laranja quente |
| 12h - 18h | 🌤️ Tarde | Rosa, roxo, rose (default) |
| 18h - 20h | 🌅 Anoitecer | Laranja, rose, roxo |
| 20h - 7h | 🌙 Noite | Modo escuro, slate, purple |

A transicao entre temas e suave e automatica.

---

## Idioma / Language

A app suporta **Portugues** 🇵🇹 e **Ingles** 🇬🇧.

### Mudar o idioma
- **Na pagina de login:** botoes PT/EN no canto superior direito
- **No menu central:** seccao Definicoes → toggle inline PT | EN
- A escolha e guardada automaticamente (persiste entre sessoes)

---

## PWA e Atualizacoes

A app funciona como **Progressive Web App (PWA)** — podes instala-la no telemovel ou computador.

### Instalar a app
- **Android/Chrome:** Menu do browser → "Instalar app" ou "Adicionar ao ecra inicial"
- **iOS/Safari:** Botao de partilha → "Adicionar ao ecra inicial"

### Atualizacoes automaticas
- O **service worker** usa `skipWaiting` + **cache purge** para garantir que recebes sempre a versao mais recente
- Quando ha uma atualizacao, a app carrega automaticamente a nova versao na proxima visita
- Nao precisas de fazer nada — as atualizacoes sao transparentes e fiaveis

---

## Dicas

- **Swipe** entre tabs para navegar rapidamente
- **Marca items como urgentes** nas compras para destacar no topo
- **Mantem streaks** nos habitos para ganhar mais pontos e badges
- O **dashboard** mostra o que e mais importante para hoje
- **Ativa notificacoes** para nao perderes lembretes de habitos
- **Envia mensagens** a outros membros diretamente pela app
- O **calendario** mostra uma visao geral de tudo o que acontece na casa

---

## Suporte

Problemas ou sugestoes? Contacta os membros da casinha ou abre um issue no [repositorio do projeto](https://github.com/Findmucker/casa-app).
